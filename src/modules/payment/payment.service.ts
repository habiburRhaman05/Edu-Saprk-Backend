import { v7 as uuidv7 } from "uuid";

import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { uploadPdfBufferToCloudinary } from "../media/media.service";
import { generatePaymentInvoiceBuffer } from "./payment.utils";

import { envConfig } from "../../config/env";
import { getProfileCacheKey } from "../auth/auth.service";
import { redis } from "../../config/redis";
import { BookingStatus, PaymentStatus, UserRole } from "../../generated/prisma/enums";
import { stripe } from "../../config/stripe";
import { emailQueue } from "../../queue/emailQueue";


const handleStripePaymentSuccess = async (paymentId: string) => {
  console.log("receive request");
  
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { session:true ,user:true},
  });

  if (!payment) throw new AppError("Payment record not found", 404);

  if (payment.status === PaymentStatus.SUCCESS) {
    return { message: "Payment already processed", payment };
  }

  // Transaction: update payment + credit wallet
  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.SUCCESS, updatedAt: new Date() },
      include: { user: true, },

    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });
    const wallet = await tx.tutorWallet.upsert({
      where: { tutorId: payment.session.tutorId },
      update: { balance: { increment: payment.amount } },
      create: { tutorId: payment.session.tutorId, balance: payment.amount },
    });
    return { payment: updatedPayment, wallet };
  });

  const invoiceResult = await generateAndSendInvoice(result.payment);

  // reset user cache 
    const cacheKey = getProfileCacheKey(payment.user.userId, UserRole.USER);
    await redis.del(cacheKey);
  console.log(invoiceResult);

  return { result, invoiceResult }
};

/**
 * Generate invoice, upload to cloud, and send email.
 */
const generateAndSendInvoice = async (payment: any) => {
  const invoicePayload = {
    status: payment.status,
    invoiceNumber: uuidv7(),
    userName: payment.user?.name || "User",
    userEmail: payment.user?.email || "Not provided",
    paymentTime: new Date().toLocaleString(),
    paymentMethod: "card",
    planName: payment.plan?.name,
    credits: payment.plan?.credits,
    amount: payment.amount,
    message: payment.plan?.name
      ? "✔ Payment Successful! Credits added to your account."
      : "✔ Session payment successful. Your booking is confirmed.",
  };

  const invoiceBuffer = await generatePaymentInvoiceBuffer(invoicePayload);
  console.log("invoice done");

  const { secure_url } = await uploadPdfBufferToCloudinary(invoiceBuffer, "Invoice", {
    folder: "blitz-analyzer/invoices",
    resource_type: "raw",
    public_id: `invoice_${payment.id}`,
  });

  // Save invoice URL
  console.log("in", secure_url);

  await prisma.payment.update({ where: { id: payment.id }, data: { invoiceUrl: secure_url } });
  console.log("invoice url save ");


  await emailQueue.add(
    "payment-success",
    {
      user: {
        name: invoicePayload.userName,
        email: invoicePayload.userEmail,
      },
      transactionId: payment.id,
      amount: invoicePayload.amount,
      credit: payment.plan?.credits ?? 0,
      invoiceUrl: secure_url,
      dashboardUrl: `${envConfig.CLIENT_URL}/dashboard`
    },
    {
      attempts: 3, // retry if failed
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `payment-${payment.id}`, // 🔥 prevents duplicate emails
    }
  );
  console.log("patment success");

  return { secure_url };
};

const createBokingPurchaseSession = async (
  studentId: string,
  bookingId: string,
  successUrl: string,
  cancelUrl: string
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { student: true, tutor: true },
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new AppError("Student not found", 404);
  }

  const successBase = successUrl.replace(/\/$/, "");
  const cancelBase = cancelUrl.replace(/\/$/, "");
  const metadataUserId = student.userId;

  const existingPayment = await prisma.payment.findUnique({
    where: { bookingId },
    include: { session: true },
  });

  const lineProductName = `Session with ${booking.tutor.name}`;

  if (
    existingPayment &&
    (existingPayment.status === PaymentStatus.FAILED ||
      existingPayment.status === PaymentStatus.PENDING)
  ) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: { name: lineProductName },
            unit_amount: booking.tutor.hourlyRate,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: booking.student.email ?? undefined,
      success_url: `${successBase}?paymentId=${existingPayment.id}&status=success`,
      cancel_url: `${cancelBase}?paymentId=${existingPayment.id}&status=cancel`,
      metadata: {
        paymentId: existingPayment.id,
        userId: metadataUserId,
        bookingId,
      },
    });

    return {
      checkoutUrl: session.url,
      paymentId: existingPayment.id,
    };
  }

  if (existingPayment?.status === PaymentStatus.SUCCESS) {
    throw new AppError("This booking is already paid", 400);
  }

  const payment = await prisma.payment.create({
    data: {
      userId: student.id,
      bookingId,
      amount: booking.tutor.hourlyRate,
      currency: "USD",
      status: PaymentStatus.PENDING,
      paymentMethod: "STRIPE",
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "USD",
          product_data: { name: lineProductName },
          unit_amount: booking.tutor.hourlyRate,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: booking.student.email ?? undefined,
    success_url: `${successBase}?paymentId=${payment.id}&status=success`,
    cancel_url: `${cancelBase}?paymentId=${payment.id}&status=cancel`,
    metadata: {
      paymentId: payment.id,
      userId: metadataUserId,
      bookingId,
    },
  });

  return {
    checkoutUrl: session.url,
    paymentId: payment.id,
  };
};


const getAllTransactions = async (query: any) => {
  const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10

  const skip = (page - 1) * limit

  const [result, total] = await Promise.all([
    prisma.payment.findMany({
      include: { user: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.payment.count()
  ])

  const data = result.map((payment) => ({
    username: payment.user.name,
    email: payment.user.email,
    paymentId: payment.id,
    paymentTime: payment.createdAt,
    invoice_url: payment.invoiceUrl,
    paymentStatus: payment.status,
    amount: payment.amount,
    currency: payment.currency,
  }))

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit)
    },
    data
  }
}


const getPaymentDetails = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: id
    },
    include: { user:true}
  })
  return payment
}
function isUuidLike(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  );
}

const getUserPaymentHistory = async (id: string, query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const statusRaw = typeof query.status === "string" ? query.status.trim() : "";
  const statusFilter =
    statusRaw && (Object.values(PaymentStatus) as string[]).includes(statusRaw)
      ? (statusRaw as PaymentStatus)
      : undefined;

  const searchRaw = typeof query.search === "string" ? query.search.trim() : "";

  const searchOr: Prisma.PaymentWhereInput[] = [];
  if (searchRaw) {
    searchOr.push({
      transactionId: { contains: searchRaw, mode: "insensitive" },
    });
    if (isUuidLike(searchRaw)) {
      searchOr.push({ id: searchRaw });
      searchOr.push({ bookingId: searchRaw });
    }
  }

  const listWhere: Prisma.PaymentWhereInput = {
    userId: id,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(searchOr.length ? { OR: searchOr } : {}),
  };

  const userWhere: Prisma.PaymentWhereInput = { userId: id };

  const [
    payments,
    totalFiltered,
    successAgg,
    allCount,
    successCount,
    pendingCount,
    failedCount,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: listWhere,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where: listWhere }),
    prisma.payment.aggregate({
      where: { ...userWhere, status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: userWhere }),
    prisma.payment.count({
      where: { ...userWhere, status: PaymentStatus.SUCCESS },
    }),
    prisma.payment.count({
      where: { ...userWhere, status: PaymentStatus.PENDING },
    }),
    prisma.payment.count({
      where: { ...userWhere, status: PaymentStatus.FAILED },
    }),
  ]);

  const totalPaid = successAgg._sum.amount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));

  return {
    meta: {
      page,
      limit,
      total: totalFiltered,
      totalPages,
      summary: {
        totalPaid,
        totalTransactions: allCount,
        successfulCount: successCount,
        pendingCount,
        failedCount,
      },
    },
    paymentsList: payments,
  };
};

export const paymentServices = { handleStripePaymentSuccess, generateAndSendInvoice, createBokingPurchaseSession, getAllTransactions, getPaymentDetails, getUserPaymentHistory }




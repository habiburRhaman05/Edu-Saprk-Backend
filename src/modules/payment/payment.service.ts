import { v7 as uuidv7 } from "uuid";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { uploadPdfBufferToCloudinary } from "../media/media.service";
import { generatePaymentInvoiceBuffer } from "./payment.utils";

import { envConfig } from "../../config/env";
import { getProfileCacheKey } from "../auth/auth.service";
import { redis } from "../../config/redis";
import { PaymentStatus, UserRole } from "../../generated/prisma/enums";
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
    message: "✔ Payment Successful! Credits added to your account.",
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
      credit: payment.plan.credits,
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
  userId: string,
  bookingId: string,
  successUrl: string,
  cancelUrl: string
) => {


  const existingPayment = await prisma.payment.findUnique({
    where:{bookingId:bookingId,status:{in:["PENDING","FAILED"]}},include:{session:true}
  });

    const booking = await prisma.booking.findUnique({
    where:{id:bookingId},
    include:{student:true,tutor:true}
  })
  // if payment already created then re-create session only
  if(existingPayment?.status === PaymentStatus.FAILED || PaymentStatus.PENDING){
      const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency:"USD",
          product_data: { name: `${booking?.student.name} - ${booking?.tutor.name} credits` },
          unit_amount: booking?.tutor.hourlyRate as number, // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: booking?.student.email!, // optional: fetch user email if available
    success_url: `${successUrl}/${existingPayment?.id!!}`,
    cancel_url: `${cancelUrl}/${existingPayment?.id!}`,
    metadata: {
      paymentId: existingPayment?.id!,
      userId,
    },
  });

   console.log("session created");

  return {
    checkoutUrl: session.url,
    paymentId: existingPayment?.id,
  };
  }

  const student = await prisma.student.findUnique({
    where: { id: userId }
  })

  if (!student) {
    throw new AppError("Invalid or student", 404);
  }



  // 2️⃣ Create pending payment record
  const payment = await prisma.payment.create({
    data: {
      userId: student.id,
      bookingId: bookingId,
      amount: booking?.tutor.hourlyRate as number,
      currency: "USD",
      status: PaymentStatus.PENDING,
      paymentMethod: "STRIPE", 
    },
  });

  // 3️⃣ Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency:"USD",
          product_data: { name: `${booking?.student.name} - ${booking?.tutor.name} credits` },
          unit_amount: booking?.tutor.hourlyRate as number, // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: booking?.student.email!, // optional: fetch user email if available
    success_url: `${successUrl}/${payment.id}`,
    cancel_url: `${cancelUrl}/${payment.id}`,
    metadata: {
      paymentId: payment.id,
      userId,
    },
  });

   console.log("session created");

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


const getPaymentDetails = async (id) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: id
    },
    include: { user:true}
  })
  return payment
}
const getUserPaymentHistory = async (id,query: any) => {
  console.log(id);
 const page = Number(query.page) || 1
  const limit = Number(query.limit) || 10
  const skip = (page - 1) * limit

  const payments = await prisma.payment.findMany({
    where: {
      userId: id
    },

    include: { user: true },
    orderBy:{createdAt:"desc"},
    skip:skip,
    take:limit
  });

  const paymentsCount = await prisma.payment.count()


  return {
   meta:{
     totalPages:paymentsCount,
   },
   paymentsList:payments


  }
}

export const paymentServices = { handleStripePaymentSuccess, generateAndSendInvoice, createBokingPurchaseSession, getAllTransactions, getPaymentDetails, getUserPaymentHistory }




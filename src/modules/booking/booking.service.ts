import { BookingStatus, PaymentStatus } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { envConfig } from "../../config/env";
import { paymentServices } from "../payment/payment.service";

interface CreateBookingPayload {
  tutorId: string;
  availabilityId: string;
}

const createBooking = async (studentId: string, payload: CreateBookingPayload) => {
  const { tutorId, availabilityId } = payload;

  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId },
  });

  if (!availability) {
    throw new AppError("Availability slot not found", 404);
  }

  if (availability.isBooked) {
    throw new AppError("This slot is already booked", 400);
  }

  if (availability.tutorId !== tutorId) {
    throw new AppError("Tutor mismatch with availability", 400);
  }

  const newBooking = await prisma.booking.create({
    data: {
      studentId,
      tutorId,
      dateTime: availability.date,
      status: BookingStatus.PENDING_PAYMENT,
      availabilityId,
    },
  });

  await prisma.availability.update({
    where: { id: availability.id },
    data: { isBooked: true },
  });

  const successBase = `${envConfig.CLIENT_URL}/dashboard/bookings`;
  const cancelBase = `${envConfig.CLIENT_URL}/dashboard/bookings`;

  const { checkoutUrl, paymentId } = await paymentServices.createBokingPurchaseSession(
    studentId,
    newBooking.id,
    successBase,
    cancelBase
  );

  return { booking: newBooking, checkoutUrl, paymentId };
};

const getAllBookings = async (
  studentId: string,
  query: { page?: string; status?: string }
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = 10;
  const skip = (page - 1) * limit;

  const rawStatus = query.status?.trim();
  const statusFilter =
    rawStatus && (Object.values(BookingStatus) as string[]).includes(rawStatus)
      ? (rawStatus as BookingStatus)
      : undefined;

  const where: Prisma.BookingWhereInput = {
    studentId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: { review: true },
    orderBy: { dateTime: "desc" },
    skip,
    take: limit,
  });

  const tutorIds = [...new Set(bookings.map((b) => b.tutorId))];

  const tutors = await prisma.tutorProfile.findMany({
    where: { id: { in: tutorIds } },
    include: { user: true },
  });

  return bookings.map((b) => ({
    ...b,
    tutor: tutors.find((t) => t.id === b.tutorId) || null,
  }));
};

const getBookingDetails = async (bookingId: string) => {
  const bookingDetails = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      review: {
        include: { student: true },
      },
      availability: {
        include: {
          tutor: {
            include: {
              user: {
                select: { profileAvater: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!bookingDetails) return null;

  return {
    ...bookingDetails,
    tutorProfile: bookingDetails.availability?.tutor || null,
  };
};

const cancelBooking = async (studentId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.studentId !== studentId) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return booking;
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
    await tx.availability.update({
      where: { id: booking.availabilityId },
      data: { isBooked: false },
    });
    await tx.payment.deleteMany({
      where: { bookingId, status: PaymentStatus.PENDING },
    });
  });

  return prisma.booking.findUnique({ where: { id: bookingId } });
};

export const bookingServices = {
  createBooking,
  getBookingDetails,
  getAllBookings,
  cancelBooking,
};

import { BookingStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { authServices } from "../auth/auth.service";


interface CreateBookingPayload {
  tutorId: string;
  availabilityId: string;
}

const createBooking = async (
  studentId: string,
  payload: CreateBookingPayload
) => {
  const { tutorId, availabilityId } = payload;

  //  Check availability slot
  const availability = await prisma.availability.findUnique({
    where: { id: availabilityId },
  });

  if (!availability) {
    throw new AppError(
      "Availability slot not found"
    );
  }

  if (availability.isBooked) {
    throw new AppError(
      "This slot is already booked"
    );
  }

  if (availability.tutorId !== tutorId) {
    throw new AppError(
      "Tutor mismatch with availability"
    );
  }




   const newBooking = await prisma.booking.create({
      data: {
        studentId,
        tutorId,
        dateTime: availability.date,
        status: "CONFIRMED",
        availabilityId:payload.availabilityId
      },
    });

    // mark slot booked
    await prisma.availability.update({
      where: { id: availability.id },
      data: { isBooked: true },
    });

  return newBooking;
};


const getAllBookings = async (userId: string,{page,status}:{page:string,status:BookingStatus}) => {


  const limit = 10;
  const skip = (Number(page) -1) * limit;


  const bookings = await prisma.booking.findMany({
    where: { studentId: userId,status:status},
    include:{
      review:true
    },
    orderBy: { dateTime: "asc" },
    skip:skip,
    take:limit
  });


  const tutorIds = [...new Set(bookings.map(b => b.tutorId))];


  const tutors = await prisma.tutorProfile.findMany({
    where: { id: { in: tutorIds }, 
  
  },
  include:{
    user:true
  }
  });


  const bookingsWithTutor = bookings.map(b => ({
    ...b,
    tutor: tutors.find(t => t.id === b.tutorId) || null
  }));

  return bookingsWithTutor;
};

const getBookingDetails = async (bookingId: string) => {
  const bookingDetails = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      student: true,
      review: {
        include:{
          student:true
        }
      },
      
      availability: {
        include: {
          tutor: {
            include:{
              user:{
                select:{
                  profileAvater:true,
                  name:true
                }
              }
            }
          }
        }
      },
    },
  });

  if (!bookingDetails) return null;

  return {
    ...bookingDetails,
    tutorProfile: bookingDetails.availability?.tutor || null,
  };
};

  const cancelBooking = async (userId: string, bookingId: string,status: "CANCELLED") => {

  await authServices.isUserExist(userId, "USER");

console.log("bookingId",bookingId);


  const isBookingExist = await prisma.booking.findUnique({
    where: {
      id: bookingId
    }
  })

  if (!isBookingExist) {
    throw new AppError("Bookign not found")
  }
  const booking = await prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      status:"CANCELLED"
    }
  });

  await prisma.availability.update({
    where:{
      id:booking.availabilityId
    },
    data:{
      isBooked:false
    }
  })

  return booking

};

export const bookingServices = {
  createBooking,
  getBookingDetails,
  getAllBookings,cancelBooking
};

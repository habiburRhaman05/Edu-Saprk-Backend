


import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { StudentProfileUpdate } from "./types";

import bcrypt from "bcrypt"
import { BookingStatus, PaymentStatus, UserRole, UserStatus } from "../../generated/prisma/enums";

const  getProfile= async (userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId }
    });
  }
const savedTutor = async (tutorId: string, studentId: string) => {
 
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new AppError("Student not found", StatusCodes.NOT_FOUND);
  }


  const isAlreadySaved = student.savedTutors.includes(tutorId);

  if (isAlreadySaved) {
    return { message: "Tutor already saved", success: true };
  }


  return await prisma.student.update({
    where: { id: studentId },
    data: {
      savedTutors: {
        push: tutorId, 
      },
    },
  });
};
  
  const updateProfile= async (userId: string, data: StudentProfileUpdate) => {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, image: true },
    });
  }




 const deleteAccount= async (userId: string) => {
    await prisma.user.delete({ where: { id: userId } });
    return { message: "Account deleted successfully" };
  };

const getStudentStatsData = async (userId: string) => {
console.log(userId);

    const [
      totalBooking,
      totalReview,
    ] = await Promise.all([
  prisma.booking.count({ where: { studentId: userId } }),
  prisma.review.count({ where: { studentId: userId } }),
]);
return {totalBooking,totalReview}
};

 async function getStudentDashboardSummary(studentId: string) {
  const [
    upcomingSessions,
    completedSessions,
    savedTutorsCount,
    paymentAgg,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        studentId,
        status: BookingStatus.CONFIRMED,
        dateTime: { gte: new Date() },
      },
    }),
    prisma.booking.count({
      where: {
        studentId,
        status: BookingStatus.COMPLETED,
      },
    }),
    prisma.tutorProfile.count({
      where: {
        bookings: { some: { studentId } },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        userId: studentId,
        status: PaymentStatus.SUCCESS,
      },
    }),
  ]);

  return {
    upcomingSessions,
    completedSessions,
    savedTutorsCount,
    totalSpent: paymentAgg._sum.amount || 0,
  };
}

 async function getStudentDashboardCharts(studentId: string) {
  const [payments, sessionHistory] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: studentId, status: PaymentStatus.SUCCESS },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.booking.findMany({
      where: { studentId },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return {
    paymentTrend: payments,
    learningProgress: sessionHistory,
  };
}


 async function getStudentDashboardDetails(studentId: string) {
  const [recentSessions, recentPayments, recommendedTutors] = await Promise.all([
    prisma.booking.findMany({
      where: { studentId },
      include: {
        tutor: {
          include: { user: true },
        },
      },
      orderBy: { dateTime: 'desc' },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.tutorProfile.findMany({
      take: 6,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    recentSessions,
    recentPayments,
    recommendedTutors,
  };
}


 async function getAllStudentDashboardData(studentId: string) {
  const [summary, charts, details] = await Promise.all([
    getStudentDashboardSummary(studentId),
    getStudentDashboardCharts(studentId),
    getStudentDashboardDetails(studentId),
  ]);

  return {
    summary,
    charts,
    details,
  };
}

const getSavedTutors = async (userId) => {


  const user = await prisma.student.findUnique({
    where:{id:userId}
  })

  if(user?.savedTutors.length === 0){
    return []
  }

  const tutors = await prisma.tutorProfile.findMany({
    where: {
      id: { in: user?.savedTutors as string[] },
    },
  });
  return tutors;

};


export const studentService = {
 getProfile,
 updateProfile,deleteAccount,
getStudentStatsData,
getAllStudentDashboardData,
savedTutor,
getSavedTutors,
 
};

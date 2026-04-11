


import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { StudentProfileUpdate } from "./types";

import bcrypt from "bcrypt"

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


export const studentService = {
 getProfile,
 updateProfile,deleteAccount,
getStudentStatsData,

savedTutor
 
};

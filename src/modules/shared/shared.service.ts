import { prisma } from "../../lib/prisma";

// -------------------- GET ALL CATEGORIES --------------------
const getAllCategories = async () => {
 
    const categories = await prisma.category.findMany({

    });
  
  return categories;
};



const getKPISData = async () => {
  const [
    totalTutors,
    totalStudent,
    activeTutors,
    tutorSubjects,
    totalBookings,
    completedBookings,
    usersWithLocation,
  ] = await Promise.all([
    prisma.tutorProfile.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.tutorProfile.count({
      where: {
        availability: {
          some: {
            isBooked: false,
            date: { gte: new Date() },
          },
        },
      },
    }),
    prisma.tutorProfile.findMany({ select: { subjects: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.user.findMany({
     
    }),
  ]);

  const totalSubjects = new Set(tutorSubjects.flatMap(t => t.subjects)).size;
  const totalCountries = new Set(usersWithLocation.map(u => u)).size;
  const successRate =
    totalBookings === 0 ? 0 : Math.round((completedBookings / totalBookings) * 100);

  return {
    totalTutors,
    totalStudent,
    activeTutors,
    totalSubjects,
    successRate,
    totalCountries,
  };
};

export const sharedServices = {

getAllCategories,
getKPISData

}
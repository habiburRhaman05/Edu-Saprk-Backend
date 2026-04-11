// src/modules/tutor/tutor.service.ts
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { authServices } from "../auth/auth.service";
import { TutorFilters, TutorProfileCreatePayload, TutorProfileUpdatePayload } from "./types";

// -------------------- CREATE TUTOR PROFILE --------------------
const createTutorProfile = async (userId: string, payload: TutorProfileCreatePayload) => {
  // Check if profile already exists
  const existing = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (existing) throw new Error("Tutor profile already exists");

  const profile = await prisma.tutorProfile.create({
    data: {
      userId,
      bio: payload.bio,
      subjects: payload.subjects,
      hourlyRate: payload.hourlyRate,
      categoryId: payload.categoryId,
      category: payload.category,
      experience: payload.experience,
      profileAvatar:"",
      name:payload.name
    },
  });
  return profile;
};

// -------------------- UPDATE TUTOR PROFILE --------------------
const updateTutorProfile = async (
  userId: string,
  payload: TutorProfileUpdatePayload
) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Tutor profile not found");
  }

  const { user, ...tutorData } = payload;
  console.log("payload",payload);
  

  if (!user) {
    throw new Error("User update data is required");
  }

  const [tutorProfile, userData] = await Promise.all([
    prisma.tutorProfile.update({
      where: { userId },
      data: tutorData,
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: user.name,
      },
    }),
  ]);

  return {
    tutorProfile,
    user: userData,
  };
};




// -------------------- GET TUTOR PROFILE --------------------
const getTutorProfile = async (userId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!profile) throw new Error("Tutor profile not found");
  return profile;
};
// -------------------- GET TUTOR SESSIONS --------------------

const getTutorSessions = async (userId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });
  if (!profile) throw new Error("Tutor profile not found");

 return prisma.booking.findMany({
    where: {
      tutorId:profile.id,
    },
    orderBy: {
      dateTime: "desc",
    },
    select: {
      id: true,
      status: true,
      dateTime: true,
      createdAt: true,
      student:{
        select:{
          profileAvatar:true,
          name:true
        }
      },
      availability: {
        select: {
          date: true,
          startTime: true,
          endTime: true,
        },
      },

      tutor: {
        select: {
          hourlyRate: true,
          subjects: true,
          category: true,
          id:true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },

      review: {
        select: {
          rating: true,
          comment: true,
        },
      },
    },
  });
};


// -------------------- PUT TUTOR CREATE AVAILABITY SLOT --------------------

const addAvailabilityService = async (userId: string, payload: any) => {
 const { date, startTime, endTime } = payload;

  // if (!date || !startTime || !endTime) {
  //   throw { statusCode: 400, message: "date, startTime, endTime required" };
  // }

  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId } ,
  });

  if (!tutor) {
    throw { statusCode: 404, message: "Tutor profile not found" };
  }

  // 🔒 Prevent overlapping slots
  const overlap = await prisma.availability.findFirst({
    where: {
      tutorId: tutor.id,
      date: new Date(date),
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
  });

  if (overlap) {
    throw { statusCode: 409, message: "Time slot overlaps existing slot" };
  }

  return prisma.availability.create({
    data: {
      tutorId: tutor.id,
      date: new Date(date),
      startTime,
      endTime,
    },
  });

};

// -------------------- GET TUTOR  AVAILABITY SLOTS --------------------

const getAvailability = async (tutorUserId: string) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId: tutorUserId },
  });

  if (!tutor) {
    throw { statusCode: 404, message: "Tutor not found" };
  }

  return prisma.availability.findMany({
    where: {
      tutorId: tutor.id,
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
};
// -------------------- GET  ALL   AVAILABITY SLOTS BY TUTORID --------------------

const getAllAvailability = async (tutorUserId: string) => {
  const slots = await prisma.availability.findMany({
    where: { tutorId: tutorUserId },
  });

 
  return slots
};
// -------------------- DELETE TUTOR  AVAILABITY SLOT --------------------

const deleteAvailability = async (
  tutorUserId: string,
  availabilityId: string
) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId: tutorUserId },
  });

  if (!tutor) {
    throw { statusCode: 404, message: "Tutor not found" };
  }

  const slot = await prisma.availability.findUnique({
    where: { id: availabilityId },
  });

  if (!slot || slot.tutorId !== tutor.id) {
    throw { statusCode: 403, message: "Unauthorized" };
  }

  if (slot.isBooked) {
    throw {
      statusCode: 400,
      message: "Cannot delete booked availability",
    };
  }

  await prisma.availability.delete({
    where: { id: availabilityId },
  });
};


// -------------------- PUT MARK AS SESSION FINISH  --------------------

const markdSessionFinish = async (userId: string, bookingId: string,status:string) => {

  await authServices.isUserExist(userId, "TUTOR");


  const isBookingExist = await prisma.booking.findUnique({
    where: {
      id: bookingId
    }
  })

  if (!isBookingExist) {
    throw new AppError("Bookign not found")
  }
  const updatedData = await prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      status:status === "COMPLETED" ? "COMPLETED" : "CANCELLED"
    }
  });

  return updatedData
};

// -------------------- GET ALL TUTORS LIST  --------------------




 const getAllTutors = async (filters: TutorFilters) => {
  const { category, q, rating, minPrice, maxPrice, subject } = filters;


  const tutorProfileFilter: Prisma.TutorProfileWhereInput = {};
  if (category) tutorProfileFilter.categoryId = category;
  if (subject) tutorProfileFilter.subjects = { has: subject };
  if (minPrice || maxPrice) {
    tutorProfileFilter.hourlyRate = {
      ...(minPrice && { gte: Number(minPrice) }),
      ...(maxPrice && { lte: Number(maxPrice) }),
    };
  }


  const userWhere: Prisma.UserWhereInput = {
    role: "TUTOR",
    status: "ACTIVE",
    tutorProfile: { isNot: null, is: tutorProfileFilter },
  };

  if (q) {
    userWhere.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tutorProfile: { is: { subjects: { has: q } } } },
    ];
  }

  const tutors = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
      tutorProfile: {
        select: {
          id: true, 
          hourlyRate: true,
          subjects: true,
          category: true,
        },
      },
    },
  });


  const tutorProfileIds = tutors
    .map((t) => t.tutorProfile?.id)
    .filter(Boolean) as string[];

  const ratings = await prisma.review.groupBy({
    by: ["tutorId"],
    where: {
      tutorId: { in: tutorProfileIds },
    },
    _avg: {
      rating: true,
    },
  });


  const ratingsMap: Record<string, number> = {};
  ratings.forEach((r) => {
    if (r._avg?.rating != null) {
      ratingsMap[r.tutorId] = r._avg.rating;
    }
  });

 
  const tutorsWithAvgRating = tutors
    .map((t) => {
     
      const avg = t.tutorProfile ? (ratingsMap[t.tutorProfile.id] ?? 0) : 0;
      return {
        ...t,
        avgRating: Number(avg.toFixed(1)),
      };
    })
    
    .filter((t) => {
      if (!rating) return true;
      return t.avgRating >= Number(rating);
    });

  return tutorsWithAvgRating;
};



// ---------------------- TUTORS PUBLIC ROUTES ---------------------

// -------------------- GET TUTOR PUBLIC PROFILE DETAILS --------------------


const getTutorProfilePublic = async (tutorUserId: string) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorUserId },
    include: {
    
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role:true
        },
      },
      availability:true
    },
  });

  if (!tutorProfile) {
    throw new Error("Tutor profile not found");
  }

  const reviews = await prisma.review.findMany({
    where: { tutorId: tutorProfile.id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      booking: {
        select: {
          id: true,
          dateTime: true,
        },
      },
    },
  });

  return {
    tutor: tutorProfile,
    reviews,
  };
};


const tutorDashboardData = async (tutorId:string) => {

  const tutorData = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    include: {
      user: { select: { name: true } },
      availability: {
        where: { isBooked: false }, 
        orderBy: { date: 'asc' },
        take: 5
      },
 
      bookings: {
        where: { status: 'CONFIRMED' },
        include: {
          student: {
            select: { name: true, profileAvatar: true }
          }
        },
        orderBy: { dateTime: 'asc' },
        take: 5
      }
    }
  });

  
  const stats = await prisma.$transaction([
   
    prisma.booking.count({
      where: { tutorId, status: 'COMPLETED' },
    }),
  
    prisma.review.aggregate({
      where: { tutorId },
      _avg: { rating: true },
      _count: { id: true }
    }),
  
    prisma.review.findMany({
      where: { tutorId },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { student: { select: { name: true } } }
    })
  ]);

  return {
    tutorData,
    totalSessions: stats[0],
    ratingData: stats[1],
    recentReview: stats[2][0]
  };
};


export const tutorServices = {
  getTutorProfile, createTutorProfile, updateTutorProfile, getTutorSessions, addAvailabilityService,
  markdSessionFinish,
  getAllTutors,
  getTutorProfilePublic,
 getAvailability,
 deleteAvailability,
 tutorDashboardData,
 getAllAvailability


}
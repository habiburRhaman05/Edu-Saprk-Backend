
import { redis } from "../../config/redis";
import { Prisma } from "../../generated/prisma/client";
import { UserStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { startOfMonth, endOfMonth } from "date-fns";


const getProfile = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId }
  });
};

const getAllUsers = async (filter) => {
  let limit = 10
  const query = filter.search
  const skip = (filter.page - 1) * limit;
  const where: Prisma.UserWhereInput = {};

// Status filter (only apply if not "ALL")
if (filter.status && filter.status !== "ALL") {
  where.status = filter.status;
}

// Search filter (search across name and email)
if (filter.search) {
  where.OR = [
    {
      name: {
        contains: filter.search,
        mode: 'insensitive', // Case-insensitive search
      },
    },
    {
      email: {
        contains: filter.search,
        mode: 'insensitive',
      },
    },
  ];
}

// Role filter (if provided)
if (filter.role && filter.role !== "ALL") {
  where.role = filter.role;
}
  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);
  return {
    meta: {
      page:filter.page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    data: users,
  };
};
const getAllBookings = async (page = 1, status, limit = 10) => {
  console.log(status,"status");
  
  const skip = (page - 1) * limit;

  return await prisma.booking.findMany({
    where: {

      ...(status && { status }),
    },
    include: {
      student: true,
      availability: true,
      review: true,
      tutor: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: skip < 0 ? 0 : skip, // Prevents errors if page is 0 or negative
    take: limit,
  });
};


const updateUserStatus = async (userId: string, status: UserStatus) => {
  console.log(status);
  
  return await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, email: true, status: true },
  });
};
const createCategory = async (payload:{
  name:string,subjects:string[]
}) => {

  const newCategory = await prisma.category.create({
    data:payload
  });

  return newCategory

};
const deleteCategory = async (categoryId:string) => {

  const newCategory = await prisma.category.delete({
   where:{
    id:categoryId
   }
  });

  return newCategory

};
const updateCategory = async (payload:{
  name:string,subjects:string[],categoryId:string
}) => {

  const newCategory = await prisma.category.update({
   where:{
    id:payload.categoryId
   },
   data:{
    name:payload.name,
    subjects:payload.subjects,
   }
  });

  return newCategory

};
export async function getDashboardData() {
  const [
    activeTutors,
    activeStudents,
    totalBookings,
    completedBookingsCount,
    completedBookings,
  ] = await Promise.all([
    // Active Tutors
    prisma.user.count({
      where: {
        role: "TUTOR",
        status: "ACTIVE",
        tutorProfile: {
          bookings: {
            some: {
              status: {
                in: ["CONFIRMED", "COMPLETED"],
              },
            },
          },
        },
      },
    }),

    // Active Students
    prisma.student.count({
      where: {
        status: "ACTIVE",
       studentBookings:{
        some:{}
       }
      },
    }),

    // Total bookings
    prisma.booking.count(),

    // Completed bookings count
    prisma.booking.count({
      where: {
        status: "COMPLETED",
      },
    }),

    // Completed bookings with tutor rate (for revenue)
    prisma.booking.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: startOfMonth(new Date()),
          lte: endOfMonth(new Date()),
        },
      },
      select: {
        tutor: {
          select: {
            hourlyRate: true,
          },
        },
      },
    }),
  ]);

  const monthlyRevenue = completedBookings.reduce(
    (sum, booking) => sum + booking.tutor.hourlyRate,
    0
  );

  const bookingRate =
    totalBookings === 0
      ? 0
      : Number(
          ((completedBookingsCount / totalBookings) * 100).toFixed(2)
        );

  return {
    activeTutors,
    activeStudents,
    monthlyRevenue,
    bookingRate,
  };
}




const getCardData = async (prisma, startOfMonth, prevMonth) => {
  const [currRev, prevRev, activeUsers, totalSessions, avgRating] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS', createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS', createdAt: { gte: prevMonth, lt: startOfMonth } } }),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.review.aggregate({ _avg: { rating: true } })
  ]);

  const currentRevenue = currRev._sum.amount || 0;
  const previousRevenue = prevRev._sum.amount || 0;
  
  return {
    totalRevenue: {
      value: currentRevenue,
      trend: previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : "0",
      isPositive: currentRevenue >= previousRevenue
    },
    activeUsers: { value: activeUsers, trend: "8.2", isPositive: true },
    totalSessions: { value: totalSessions, trend: "15.3", isPositive: true },
    avgRating: { value: parseFloat((avgRating._avg.rating || 0).toFixed(1)), trend: "0.2", isPositive: true }
  };
};

const getChartData = async (prisma, startOfWeek, startOfYear) => {
  // Weekly Stats (Revenue & Sessions)
  const weeklyStats = await prisma.$queryRaw`
    SELECT TO_CHAR(DATE_TRUNC('day', b."createdAt"), 'Dy') as day,
    COUNT(b.id)::int as sessions, COALESCE(SUM(p.amount), 0)::int as revenue
    FROM "Booking" b LEFT JOIN "payment" p ON p."bookingId" = b.id AND p.status = 'SUCCESS'
    WHERE b."createdAt" >= ${startOfWeek} GROUP BY 1 ORDER BY MIN(b."createdAt") ASC`;

  
  const categories = await prisma.category.findMany({
  });

  // Monthly Trends
  const monthlyRevenue = await prisma.$queryRaw`
    SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') as month, SUM(amount)::int as revenue
    FROM "payment" WHERE status = 'SUCCESS' AND "createdAt" >= ${startOfYear} GROUP BY 1 ORDER BY MIN("createdAt")`;

  return {
    weeklyRevenueAndSessions: weeklyStats,
    sessionsByCategory:5,
    monthlyRevenueTrend: monthlyRevenue
  };
};

const getListingData = async (prisma) => {
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { name: true } },
      tutor: { select: { name: true } },
  
    }
  });

  return recentBookings.map(b => ({
    id: `BK${b.id.substring(0, 4).toUpperCase()}`,
    student: b.student?.name,
    tutor: b.tutor?.name,
    date: b.createdAt,
    status: b.status
  }));
};



const getRequestData = async ()=>{

  // const cached = await redis.get("admin-dashboard-data");
  // if(cached){
  //   return JSON.parse(cached)
  // }

  const stats = await prisma.$transaction([
  // Total Revenue
  prisma.payment.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  }),
  // Active Users
  prisma.student.count({
    where: { status: 'ACTIVE' }
  }),
  // Total Sessions
  prisma.session.count(),
  // Avg Rating
  prisma.review.aggregate({
    _avg: { rating: true }
  })
]);

  const adminStats = [
  { label: "Total Revenue", value: `$${stats[0]._sum.amount || 0}` },
  { label: "Active Users", value: stats[1].toString() },
  { label: "Total Sessions", value: stats[2].toString() },
  { label: "Avg Rating", value: stats[3]._avg.rating?.toFixed(1) || "0" },
];

const weeklyData = await prisma.payment.groupBy({
  by: ['createdAt'],
  where: {
    createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) },
    status: 'SUCCESS'
  },
  _sum: { amount: true },
});

const monthlyRevenueRaw: any[] = await prisma.$queryRaw`
  SELECT 
    TO_CHAR("createdAt", 'Mon') AS name,
    SUM(amount) AS revenue,
    COUNT(DISTINCT "userId") AS users
  FROM "payment"
  WHERE "status" = 'SUCCESS'
  GROUP BY TO_CHAR("createdAt", 'Mon'), EXTRACT(MONTH FROM "createdAt")
  ORDER BY EXTRACT(MONTH FROM "createdAt")
`;

// Convert BigInts to Numbers so JSON.stringify doesn't crash
const monthlyRevenue = monthlyRevenueRaw.map(item => ({
  ...item,
  revenue: Number(item.revenue),
  users: Number(item.users)
}));
 const latestBooking = await getRecendBooking();
 const finlaResult = {
  adminStats,
  weeklyData,
  monthlyRevenue,
  latestBooking
 }
//  await redis.set("admin-dashboard-data",JSON.stringify(finlaResult))

 return finlaResult
}

const getRecendBooking = async ()=>{
  const bookings = await prisma.booking.findMany({
  take: 8,
  orderBy: { createdAt: 'desc' },
  include: {
    student: {
      select: { name: true, id: true }
    },
    tutor: {
      select: { 
        id: true,
        category: true // Assuming subject comes from category/bio
      }
    },
    payments: {
      select: { amount: true }
    }
  }
});

const formattedBookings = bookings.map(b => ({
  id: b.id,
  student: b.student.name,
  studentId: b.student.id,
  tutorId: b.tutor.id,
  subject: b.tutor.category,
  date: b.dateTime.toLocaleDateString(),
  time: b.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  status: b.status.toLowerCase(),
  amount: b.payments?.amount || 0,
}));
return formattedBookings
}


export const adminServices = {
  getProfile,
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  createCategory,
  updateCategory,deleteCategory,getDashboardData,
  getChartData,getCardData,getListingData,
  getRequestData
};

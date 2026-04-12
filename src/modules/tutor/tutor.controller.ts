
import { NextFunction, Request, Response } from "express";
import { tutorServices } from "./tutor.service";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";


// -------------------- CREATE PROFILE --------------------

  const createProfile =async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId!; // injected by authMiddleware
      const profile = await tutorServices.createTutorProfile(userId, req.body);
      res.status(201).json({ message: "Profile created successfully", profile });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // -------------------- UPDATE PROFILE --------------------
 const updateProfile=async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const profile = await tutorServices.updateTutorProfile(userId, req.body);
      res.status(200).json({ message: "Profile updated successfully", profile });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // -------------------- GET PROFILE --------------------
 const getProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const profile = await tutorServices.getTutorProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  // -------------------- GET TUTOR SESSIONS --------------------
 const getTutorSessions = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const sessions = await tutorServices.getTutorSessions(userId);
      res.status(200).json({
        message:"session fetch successfully",
        data:sessions
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  // -------------------- GET TUTOR  AVIAVLEITY --------------------
 const getAvailability = async (req: Request, res: Response) => {
    try {
     const tutorUserId =req.user?.userId!;
  const result = await tutorServices.getAvailability(tutorUserId);

  res.status(200).json({
    success: true,
    data: result,
  });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  // -------------------- GET TUTOR  AVIAVLEITY  SLOTS--------------------
 const getAllAvailabilitys = async (req: Request, res: Response) => {
    try {
     const tutorUserId =req.user?.userId!;
  const result = await tutorServices.getAllAvailability(tutorUserId);
console.log(result);

  res.status(200).json({
    success: true,
    data: result,
  });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  // -------------------- PUT TUTOR ADD AVIAVLEITY --------------------
 const addAvailabilityController = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId!;

     
      const updatedData = await tutorServices.addAvailabilityService(userId,req.body);
      res.status(200).json({
        message:"added availability successfully",
        data:updatedData
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  // -------------------- PUT TUTOR ADD AVIAVLEITY --------------------
 const deleteAvailability = async (req: Request, res: Response) => {
    try {
    const tutorUserId =req.user?.userId!;
    const availabilityId = req.params.id as string

    await tutorServices.deleteAvailability(tutorUserId, availabilityId);

    res.status(200).json({
      success: true,
      message: "Availability removed",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
  }
  // -------------------- PUT MARKD SESSION FINISH  --------------------
 const markdSessionFinishController = async (req: Request, res: Response,next:NextFunction) => {
    try {
      const tutor = res.locals.user as { id: string };
      const sessionId = req.params.sessionId as string;
      const { status } = req.body;

      const updateSession = await tutorServices.markdSessionFinish(tutor.id, sessionId, status);
      sendSuccess(res,{
        message:"session marked sucessfully",
        data:updateSession
      });
    } catch (error: any) {
     next(error)
    }
  }

  const getTutorEarningsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId!;
      const data = await tutorServices.getTutorEarnings(userId);
      sendSuccess(res, {
        message: "Earnings fetched successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  };
  // -------------------- GET ALL TUTORS LIST CONTROLLER  --------------------

 const gettingAllTutorsLists = async (req: Request, res: Response,next:NextFunction) => {
  try {
    const filters = {
      category: req.query.category as string | undefined,
      q: req.query.q as string | undefined,
      maxPrice: req.query.maxPrice as string | undefined,
      minPrice: req.query.minPrice as string | undefined,
      rating: req.query.rating as string | undefined,
      subject: req.query.subject as string | undefined,
    };

    const allTutors = await tutorServices.getAllTutors(filters);

    return res.status(200).json({
      success: true,
      message: "Fetch tutors successfully",
      data: allTutors,
    });
  } catch (error) {
    next(error);
  }
  }


  // -------------------------------------- TUTORS PUBLIC ROUTES ----------------------------

    // -------------------- GET TUTOR PROFILE DETAILS --------------------
 const getTutorProfileDetails = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).params.id
      const sessions = await tutorServices.getTutorProfilePublic(userId);
      res.status(200).json({
        message:"tutor profile fetch successfully",
        data:sessions
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }


  const getTutorDashboard = async (req: Request, res: Response,next:NextFunction) => {
  try {
  

    const user = await prisma.user.findUnique({
      where:{id:req.user?.userId!},
      include:{tutorProfile:true}
    })

    if(!user){
      return sendError(res,{
        message:"User Not found"
      })
    }
    const tutorId = user.tutorProfile?.id; 

    // ২. সার্ভিস কল করা
    const dashboardData = await tutorServices.tutorDashboardData(tutorId as string);

    if (!dashboardData.tutorData) {
      return res.status(200).json({
        success: true,
        message: "Profile incomplete",
        data: {
          profile: {
            name: user.name,
            totalSessions: 0,
            avgRating: 0,
            totalReviews: 0,
          },
          upcomingSessions: [],
          availability: [],
          recentFeedback: null,
          profileIncomplete: true
        }
      });
    }

    // ৪. সাকসেস রেসপন্স
    res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        profile: {
          name: dashboardData.tutorData.user.name,
          totalSessions: dashboardData.totalSessions,
          avgRating: dashboardData.ratingData._avg.rating || 0,
          totalReviews: dashboardData.ratingData._count.id,
        },
        upcomingSessions: dashboardData.tutorData.bookings,
        availability: dashboardData.tutorData.availability,
        recentFeedback: dashboardData.recentReview ? {
          comment: dashboardData.recentReview.comment,
          studentName: dashboardData.recentReview.student.name,
        } : null
      }
    });

  } catch (error:any) {
    console.error("Dashboard Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};







 export const tutorControllers = {
    createProfile,
    updateProfile,
    getProfile,
    getTutorSessions,
    addAvailabilityController,
    markdSessionFinishController,
    gettingAllTutorsLists,
    deleteAvailability,
    getAvailability,
    getTutorProfileDetails,
   getAllAvailabilitys,
   getTutorDashboard,
   getTutorEarningsController,
 }
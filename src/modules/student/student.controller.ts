
import { NextFunction, Request, Response } from "express";
import { studentService } from "./student.service";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
 const getProfile= async (req: Request, res: Response,next:NextFunction) => {
    try {
      const user = await studentService.getProfile(req.user!.userId);
  
      return sendSuccess(res,{
        statusCode:200,
        message:"fetch profile successfully",
        data:user
      })
    } catch (err: any) {
      next(err)
    }
  }

 const updateProfile= async (req: Request, res: Response,next:NextFunction) => {
    try {
      const data = req.body;
      const updated = await studentService.updateProfile(req.user!.userId, data);
    return sendSuccess(res,{
        statusCode:200,
        message:" profile updated successfully",
        data:updated
      })
    } catch (err: any) {
            next(err)

    }
  }
 const updateProfileAvater= async (req: Request, res: Response,next:NextFunction) => {
    try {
      const data = req.body;
      console.log("data",data);
      
      // const updated = await studentService.updateProfile(req.user!.userId, data);
    return sendSuccess(res,{
        statusCode:200,
        message:" profile avater updated successfully",
        data:{
          profileAvater:"https://static.vecteezy.com/system/resources/thumbnails/032/176/191/small/business-avatar-profile-black-icon-man-of-user-symbol-in-trendy-flat-style-isolated-on-male-profile-people-diverse-face-for-social-network-or-web-vector.jpg"
        }
      })
    } catch (err: any) {
            next(err)

    }
  }

  const getSavedTutors = asyncHandler(async (req: Request, res: Response,next:NextFunction) => {
   
      const userId = res.locals.user.id
      const tutors = await studentService.getSavedTutors(userId);
      return sendSuccess(res,{
        statusCode:200,
        data:tutors,
        message:"saved tutors fetched successfully"
      })

  });

  const deleteAccount= async (req: Request, res: Response,next:NextFunction) => {
    try {
   await studentService.deleteAccount(req.user!.userId);
    return sendSuccess(res,{
        statusCode:200,
        message:"account delete successfully",
    
      })
    } catch (err: any) {
    next(err)
    }
  }



  // ============== FRONTEND UI RENDERING LOGIC =======================

  const getStudentdashboardStats = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const userId =  req.params?.id as string
      console.log("user",req.user);
      
      const stats = await studentService.getStudentStatsData(userId!);
      return sendSuccess(res,{
        statusCode:200,
        data:stats,
        message:"fetch dashboard stats successfully"
      })
    } catch (error) {
      next(error)
    }
  }
  const getStudentdashboardData = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const userId =  res.locals.user.id
      const stats = await studentService.getAllStudentDashboardData(userId!);
      return sendSuccess(res,{
        statusCode:200,
        data:stats,
        message:"fetch student dashboard data successfully"
      })
    } catch (error) {
      next(error)
    }
  }
  const saveTutor = async (req:Request,res:Response,next:NextFunction)=>{
    try {
      const tutorId =  req.params?.TutorId as string

      
      const stats = await studentService.savedTutor(tutorId!,res.locals.user.id);
      return sendSuccess(res,{
        statusCode:200,
        data:stats,
        message:"tutor saved successfully"
      })
    } catch (error) {
      next(error)
    }
  }





export const studentController = {
  getSavedTutors,
 getProfile,updateProfile,deleteAccount,getStudentdashboardStats,updateProfileAvater,saveTutor,getStudentdashboardData
};

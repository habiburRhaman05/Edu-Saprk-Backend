import { NextFunction, Request, Response } from "express";
import { adminServices } from "./admin.service";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { prisma } from "../../lib/prisma";

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await adminServices.getProfile(req.user!.userId);
    return sendSuccess(res, {
      statusCode: 200,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("main user",req.user);
    const filters = {
      page:req.query.page,
      status:req.query.status,
      search:req.query.q
    }
    console.log("filter",filters);
    
    const users = await adminServices.getAllUsers(filters);
    return sendSuccess(res, {
      statusCode: 200,
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};


const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    console.log(req.body);
    
    const user = await adminServices.updateUserStatus(req.params.id as string, status);
    return sendSuccess(res, {
      statusCode: 200,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const {page,status} = req.query

    const user = await adminServices.getAllBookings(page,status);
    return sendSuccess(res, {
      statusCode: 200,
      message: "bookings fetch successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
const createNewCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {

   
    const newCategory = await adminServices.createCategory(req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: "bookings fetch successfully",
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};
const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const {name,subjects} = req.body;
    const categoryId = req.params.categoryId
   
    const updatedCategory = await adminServices.updateCategory({
        name,subjects,categoryId:String(categoryId)
    });
    return sendSuccess(res, {
      statusCode: 200,
      message: "category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};
const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const categoryId = req.params.categoryId
   
    const newCategory = await adminServices.deleteCategory(String(categoryId));
    return sendSuccess(res, {
      statusCode: 200,
      message: "category delete successfully",
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};
const getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
  try {

 
   
    const data = await adminServices.getDashboardData();
    return sendSuccess(res, {
      statusCode: 200,
      message: "category delete successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};


export const getAdminDashboardData = asyncHandler(async (req, res) => {
  //  const now = new Date();
  //   const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  //   const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  //   const startOfYear = new Date(now.getFullYear(), 0, 1);
  //   const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));

  //   // Execute all 3 steps in parallel for maximum performance
  //   const [kpiCards, charts, recentBookings] = await Promise.all([
  //     adminServices.getCardData(prisma, startOfCurrentMonth, startOfPrevMonth),
  //     adminServices.getChartData(prisma, startOfWeek, startOfYear),
  //     adminServices.getListingData(prisma)
  //   ]);

  const result = await adminServices.getRequestData()

   return sendSuccess(res,{
    data:result
   })
})


export const adminControllers = {
  getProfile,
getAllBookings,
  getAllUsers,
  updateUserStatus,
  createNewCategory,
  updateCategory,deleteCategory,
  getAdminDashboardData
};
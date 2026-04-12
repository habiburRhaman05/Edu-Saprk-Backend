
import  { NextFunction, Request, Response } from "express";
import { bookingServices } from "./booking.service";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { Student } from "../../generated/prisma/client";


const createBooking = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const student = res.locals.user as Student;
    if (!student?.id) {
      return sendError(res, { message: "Student profile required", statusCode: 403 });
    }
    const result = await bookingServices.createBooking(student.id, req.body);
    return sendSuccess(res,{
      statusCode:201,
      message:"booking created successfully",
      data:result
    })
  } catch (error) {
next(error)
  }
}

const getAllBookings  = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const student = res.locals.user as Student;
    if (!student?.id) {
      return sendError(res, { message: "Student profile required", statusCode: 403 });
    }
    const { page, status } = req.query;
    const bookings = await bookingServices.getAllBookings(student.id, {
      page: page as string | undefined,
      status: status as string | undefined,
    });
    return sendSuccess(res,{
      statusCode:200,
      message:"your bookings fetch successfully",
      data:bookings || []
    })
  } catch (error) {
next(error)
  }
}
const getBookingsDeatils  = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const bookingId = req.params.id as string

    
    const booking = await bookingServices.getBookingDetails(bookingId);
    return sendSuccess(res,{
      statusCode:200,
      message:"your bookings fetch successfully",
      data:booking || {}
    })
  } catch (error) {
next(error)
  }
}
const cancelBooking  = async (req:Request,res:Response,next:NextFunction)=>{
  try {
       const bookingId = req.params.id as string
       const student = res.locals.user as Student;
       if (!student?.id) {
         return sendError(res, { message: "Student profile required", statusCode: 403 });
       }
       const updateSession = await bookingServices.cancelBooking(student.id, bookingId);
       sendSuccess(res,{
         message:"session cancel sucessfully",
         data:updateSession
       });
     } catch (error: any) {
      next(error)
     }
}

 export const bookingControllers = {
    
   createBooking,
   getBookingsDeatils,getAllBookings,cancelBooking}
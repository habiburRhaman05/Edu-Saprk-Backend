
import  { NextFunction, Request, Response } from "express";
import { bookingServices } from "./booking.service";
import { sendSuccess } from "../../utils/apiResponse";


const createBooking = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const studentId = req.user?.userId!
    const booking = await bookingServices.createBooking(studentId,req.body);
    return sendSuccess(res,{
      statusCode:201,
      message:"booking created successfully",
      data:booking
    })
  } catch (error) {
next(error)
  }
}

const getAllBookings  = async (req:Request,res:Response,next:NextFunction)=>{
  try {
    const studentId = req.user?.userId!;
    const {page,status} = req.query



    const bookings = await bookingServices.getAllBookings(studentId,{page,status});
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
       const {status} = req.body
       const sessionId = req.params.id as string
       const studentId = req.user?.userId as string
 
       const updateSession = await bookingServices.cancelBooking(studentId,sessionId,status);
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
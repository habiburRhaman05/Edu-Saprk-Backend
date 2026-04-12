import { NextFunction, Request, Response } from "express";
import { reviewsServives } from "./review.service";
import { sendSuccess } from "../../utils/apiResponse";
import { Student } from "../../generated/prisma/client";

const createReview = async (req:Request,res:Response,next:NextFunction) =>{
    try {
        const student = res.locals.user as Student;
        const newReview = await reviewsServives.createReview({...req.body, studentId: student.id});
        return sendSuccess(res,{
            statusCode:201,
            message:"your Review Created successfully",
            data:newReview
        })
    } catch (error) {
     next(error)   
    }
}
const getAllReview = async (req:Request,res:Response,next:NextFunction) =>{
    try {
        const tutorId = req.params.tutorId
        console.log("tutorId",tutorId);
        
        const allReviewByTutorId = await reviewsServives.getAllReview(tutorId as string);
        return sendSuccess(res,{
            statusCode:201,
            message:"your Review fetch successfully",
            data:allReviewByTutorId
        })
    } catch (error) {
     next(error)   
    }
}

export const reviewControllers = {createReview,getAllReview}
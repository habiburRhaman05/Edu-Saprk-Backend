import { Router } from "express";

import adminRoutes from "../modules/admin/admin.route";
import authRoutes from "../modules/auth/auth.route";
import bookingRoutes from "../modules/booking/booking.route";
import mediaRouter from "../modules/media/media.route";
import paymentRouter from "../modules/payment/payment.route";
import reviewRoutes from "../modules/review/review.route";
import sharedRoutes from "../modules/shared/shared.route";
import studentRoutes from "../modules/student/student.route";
import tutorRoutes, { tutorsRouterPublic } from "../modules/tutor/tutor.route";

import aiRoutes from "../modules/generativeAI/ai.routes";
import issueRouter from "../modules/issue/issue.routes";
import blogRoutes from "../modules/blog/blog.routes";

const indexRouter = Router();

indexRouter.use("/upload-media",mediaRouter)
indexRouter.use("/generative-ai",aiRoutes)
indexRouter.use("/issue",issueRouter)
indexRouter.use("/auth",authRoutes) // auth routes
indexRouter.use("/tutor",tutorRoutes) // only tutor private routes
indexRouter.use("/review",reviewRoutes) // only tutor private routes
indexRouter.use("/tutors",tutorsRouterPublic) // tutors public access routes
indexRouter.use("/booking",bookingRoutes) // student only booking routes
indexRouter.use("/student",studentRoutes) // student only 
indexRouter.use("/admin",adminRoutes) // admin only 
indexRouter.use("/shared",sharedRoutes)
indexRouter.use("/payment",paymentRouter) // payments routes
indexRouter.use("/blog", blogRoutes)

export default indexRouter
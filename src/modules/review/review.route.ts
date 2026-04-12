
import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";
import { validateRequest } from "../../middleware/validateRequest";
import { reviewSchemas } from "./review.schema";
import { reviewControllers } from "./review.controller";
import { UserRole } from "../../generated/prisma/enums";

const router:Router = Router();


router.post("/",authMiddleware,roleMiddleware([UserRole.USER]),validateRequest(reviewSchemas.createReviewSchema),reviewControllers.createReview)
// router.get("/:studentId",authMiddleware,roleMiddleware(["STUDENT"]),validateRequest(reviewSchemas.createReviewSchema),reviewControllers.createReview)
router.get("/:tutorId",authMiddleware,roleMiddleware(["TUTOR"]),reviewControllers.getAllReview)




export default router;


import { Router } from "express";
import { studentController } from "./student.controller";
import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";

const router:Router = Router();

// Only students can access these routes


router.get("/profile",authMiddleware,roleMiddleware(["STUDENT"]), studentController.getProfile);
router.put("/profile",authMiddleware,roleMiddleware(["STUDENT"]), studentController.updateProfile);
router.post("/profile/avater-change",authMiddleware,roleMiddleware(["STUDENT"]), studentController.updateProfile);
router.get("/:id/dashboard/stats",authMiddleware,roleMiddleware(["STUDENT"]),studentController.getStudentdashboardStats);

router.post("/savedTutor/:tutorId",authMiddleware,roleMiddleware(["STUDENT"]),studentController.saveTutor);

 


export default router;

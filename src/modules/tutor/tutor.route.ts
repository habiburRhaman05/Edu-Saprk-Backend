
import { Router } from "express";
import { authMiddleware, roleMiddleware} from "../../middleware/auth-middlewares";
import { tutorControllers } from "./tutor.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { tutorSchemas } from "./tutor.schema";
import { UserRole } from "../../generated/prisma/enums";

const router:Router = Router();

export const tutorsRouterPublic:Router = Router()

router.post("/profile", authMiddleware,roleMiddleware([UserRole.TUTOR]),validateRequest(tutorSchemas.createTutorProfileSchema), tutorControllers.createProfile);
router.put("/profile",authMiddleware,roleMiddleware([UserRole.TUTOR]), tutorControllers.updateProfile);
router.get("/sessions",authMiddleware,roleMiddleware([UserRole.TUTOR]), tutorControllers.getTutorSessions);
router.get("/dashboard-data/:tutorId",authMiddleware,roleMiddleware([UserRole.TUTOR]), tutorControllers.getTutorDashboard);
router.get("/earnings", authMiddleware, roleMiddleware([UserRole.TUTOR]), tutorControllers.getTutorEarningsController);

// mark session complete
router.put("/sessions/:sessionId/finish-session",authMiddleware,roleMiddleware([UserRole.TUTOR]), tutorControllers.markdSessionFinishController);
// add availibity slot 
router.put("/availability",authMiddleware,roleMiddleware([UserRole.TUTOR]),validateRequest(tutorSchemas.addAvailabilitySchema), tutorControllers.addAvailabilityController);
router.get("/availability",authMiddleware,roleMiddleware([UserRole.TUTOR]), tutorControllers.getAllAvailabilitys);
router.get("/get-dashboard-data",authMiddleware,roleMiddleware([UserRole.TUTOR]), tutorControllers.getTutorDashboard);

router.delete(
  "/availability/:id",
  authMiddleware,
  roleMiddleware([UserRole.TUTOR]),
  tutorControllers.deleteAvailability
);

// public routes

tutorsRouterPublic.get("/",tutorControllers.gettingAllTutorsLists) //Get all tutors with filters
tutorsRouterPublic.get("/:id",tutorControllers.getTutorProfileDetails) // Get tutor details





export default router;


import { Router } from "express";

import { authMiddleware, roleMiddleware} from "../../middleware/auth-middlewares";
import { authControllers } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { authSchemas } from "./auth.schema";
import { studentSchemas } from "../student/student.schema";
import { studentController } from "../student/student.controller";
import { upload } from "../upload/upload-image.service";
import { UserRole } from "../../generated/prisma/enums";


const router:Router = Router();

router.post("/register",validateRequest(authSchemas.registerUserSchema), authControllers.registerController);
router.post("/login",validateRequest(authSchemas.loginSchema), authControllers.loginController);
router.post("/refresh-token", authControllers.getRefreshTokenController);
router.post(
  "/verify-email",
  validateRequest(authSchemas.verifyEmailSchema),
  authControllers.verifyEmail
);
router.get("/me", authMiddleware, authControllers.getUserProfileController);
router.put("/profile/change-avater",authMiddleware,roleMiddleware([UserRole.STUDENT,UserRole.TUTOR,UserRole.ADMIN,UserRole.MODERATOR,UserRole.TECHNICIAN]),upload.single("file"), authControllers.changeProfileAvatar);
router.put("/profile/update",authMiddleware,roleMiddleware([UserRole.STUDENT,UserRole.TUTOR,UserRole.ADMIN,UserRole.MODERATOR,UserRole.TECHNICIAN]),upload.single("file"), authControllers.updateProfileInfo);
router.post("/logout", authMiddleware, authControllers.logoutUserController);
//  ============== FOR STUDENT/USER AND TUTOR BOTH CAN USE IT ==============
router.put("/change-password",authMiddleware, validateRequest(studentSchemas.changePasswordSchema), authControllers.changePasswordController);
router.delete("/delete-account",authMiddleware,roleMiddleware([UserRole.STUDENT,UserRole.TUTOR]), studentController.deleteAccount);
export default router;

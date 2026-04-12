
import { Router } from "express";
import { adminControllers } from "./admin.controller";
import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";
import { validateRequest } from "../../middleware/validateRequest";
import { adminSchemas } from "./admin.schemas";

const router:Router = Router();

// All routes protected: ADMIN and MODERATOR role
router.use(authMiddleware, roleMiddleware(["ADMIN", "MODERATOR"]));


router.get("/profile", adminControllers.getProfile);

router.get("/users", adminControllers.getAllUsers);
router.get("/bookings", adminControllers.getAllBookings);
router.post("/categories",validateRequest(adminSchemas.createCategorySchema), adminControllers.createNewCategory);
router.delete("/categories/:categoryId", adminControllers.deleteCategory);
router.patch("/categories/:categoryId", adminControllers.updateCategory);
router.get("/bookings", adminControllers.getAllBookings);
router.get("/get-dashboard-data", adminControllers.getAdminDashboardData);

router.patch("/users/:id/status", adminControllers.updateUserStatus);

export default router;

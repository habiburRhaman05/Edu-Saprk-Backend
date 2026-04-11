import { Router } from "express";
import { buyCredits, getAllTransactions, getPaymentDetails, getUserPaymentHistoryById } from "./payment.controller";
import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";
import { validateRequest } from "../../middleware/validateRequest";
import { buyCreditSchema } from "./payment.validation";
import { UserRole } from "../../../generated/prisma/enums";

const paymentRouter = Router();

// ✅ Buy credits (User)
paymentRouter.post(
  "/generate-session",
  authMiddleware, 
  roleMiddleware(["USER"]),
  validateRequest(buyCreditSchema),
  buyCredits
);
// ✅ Buy credits (User)
paymentRouter.get(
  "/get-all-transactions",
  authMiddleware, 
  roleMiddleware([UserRole.ADMIN]),
  getAllTransactions
);
// ✅ Buy credits (User)
paymentRouter.get(
  "/:id",
  authMiddleware, 
  getPaymentDetails
);
// ✅ Buy credits (User)
paymentRouter.get(
  "/user/:userId/transactions",
  authMiddleware, 
  roleMiddleware([UserRole.STUDENT,UserRole.TUTOR]),
  getUserPaymentHistoryById
);


export default paymentRouter;
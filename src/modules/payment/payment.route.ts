import { Router } from "express";
import { buyCredits, getAllTransactions, getPaymentDetails, getUserPaymentHistoryById } from "./payment.controller";
import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";
import { validateRequest } from "../../middleware/validateRequest";
import { buyCreditSchema } from "./payment.validation";
import { UserRole } from "../../generated/prisma/enums";

const paymentRouter = Router();


paymentRouter.post(
  "/generate-session",
  authMiddleware, 
  roleMiddleware(["USER"]),
  validateRequest(buyCreditSchema),
  buyCredits
);

paymentRouter.get(
  "/get-all-transactions",
  authMiddleware, 
  roleMiddleware([UserRole.ADMIN]),
  getAllTransactions
);

paymentRouter.get(
  "/:id",
  authMiddleware, 
  getPaymentDetails
);

paymentRouter.get(
  "/user/:userId/transactions",
  authMiddleware, 
  roleMiddleware([UserRole.STUDENT,UserRole.TUTOR]),
  getUserPaymentHistoryById
);


export default paymentRouter;
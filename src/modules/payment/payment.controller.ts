import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { paymentServices } from "./payment.service";
import { BuyCreditInput, StripeWebhookInput } from "./payment.interface";
import { buyCreditSchema, stripeWebhookSchema } from "./payment.validation";

// ✅ User buys credits (creates pending payment + stripe session)
export const buyCredits = asyncHandler(async (req: Request, res: Response) => {
  const { planId, successUrl, cancelUrl } = req.body;

  const userId = res.locals.user.id; 

  const { checkoutUrl, paymentId } = await paymentServices.createCreditPurchaseSession(
    userId,
    planId,
    successUrl,
    cancelUrl
  );

  return sendSuccess(res, {
    message: "Checkout session created",
    data: { checkoutUrl, paymentId },
  });
});




// ✅ Get Paymment Details By ID

 export const getPaymentDetails = asyncHandler(async (req: Request, res: Response) => {


  const paymentId = req.params.id 

  const paymentData = await paymentServices.getPaymentDetails(
   paymentId as string
  );

  return sendSuccess(res, {
    message: "payment details fetched",
    data: paymentData,
  });
});
// ✅ Get User Paymment History

 export const getUserPaymentHistoryById = asyncHandler(async (req: Request, res: Response) => {


  const userId =   req.params.userId;
console.log(userId);

  const paymentLists = await paymentServices.getUserPaymentHistory(
   userId as string,req.query
  );

  return sendSuccess(res, {
    message: "Fettch al paymemnt history",
    data: paymentLists,
  });
});



// ✅ Stripe webhook: mark payment complete
export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { paymentId } = stripeWebhookSchema.parse(req.body) as StripeWebhookInput;
console.log(`received webhook paymentId=${paymentId}`);

  const result = await paymentServices.handleStripePaymentSuccess(paymentId);
console.log("payment done",paymentId);
console.log(result);


  return sendSuccess(res, {
    message: "Payment processed successfully",
    data: result,
  });
});
// ✅ Stripe webhook: mark payment complete
export const getAllTransactions = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentServices.getAllTransactions(req.query);
  return sendSuccess(res, {
    message: "All Transactions  fetch successfully",
    data: result,
  });
});
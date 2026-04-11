import Stripe from "stripe";
import { envConfig } from "../../config/env";

import { sendError, sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

import { AppError } from "../../utils/AppError";
import { paymentServices } from "../payment/payment.service";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../config/stripe";
import { StatusCodes } from 'http-status-codes';

export const handleStripeWebhookController = asyncHandler(async (req, res) => {
  console.log("🔥 Webhook received");

  const endpointSecret = envConfig.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature || !endpointSecret) {
      throw new AppError("Missing Stripe signature or webhook secret", StatusCodes.BAD_REQUEST);
    }
    const payload = (req as any).rawBody || req.body;
    console.log("payload", payload);


    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      endpointSecret
    );

  } catch (err: any) {
    console.error("❌ Stripe Webhook Error:", err.message);
    console.error(err);
    throw new AppError(`Webhook Error: ${err.message}`, StatusCodes.BAD_REQUEST);
  }

  try {
    switch (event.type) {


      case "checkout.session.completed": {
        console.log("✅ checkout.session.completed received");

        const session = event.data.object as Stripe.Checkout.Session;
        if (session.status !== "complete") {
          console.log("⚠️ Session not complete, skipping");
          break;
        }

        //Get PaymentIntent
        const paymentIntentId = session.payment_intent as string;

        if (!paymentIntentId) {
          throw new AppError("Missing payment_intent in session", 400);
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        const userId = session.metadata?.userId || paymentIntent.metadata?.userId;
        const paymentId = session.metadata?.paymentId || paymentIntent.metadata?.paymentId;

        if (!userId || !paymentId) {
          console.warn("❌ Missing metadata in Session AND PaymentIntent");
          console.log("Session Metadata:", session.metadata); // Debug what's actually there
          return sendError(res, {
            statusCode: 400,
            message: "Missing userId or paymentId in metadata",
          });
        }

        console.log("💰 Processing payment:", paymentId);

        await paymentServices.handleStripePaymentSuccess(paymentId);

        console.log("✅ Payment processed successfully");
        break;
      }

      // ❌ Payment failed
      case "payment_intent.payment_failed": {
        console.log("❌ payment_intent.payment_failed");

        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const paymentId = paymentIntent.metadata?.paymentId;

        if (!paymentId) {
          console.warn("Missing paymentId in failed payment");
          break;
        }

        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });

        console.log(`❌ Payment ${paymentId} marked as FAILED`);
        break;
      }
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("❌ Webhook processing error:", err);
    throw new AppError(err.message || "Webhook processing failed", 500);
  }

  return sendSuccess(res, {
    message: `Stripe webhook event ${event.id} processed successfully.`,
  });
});
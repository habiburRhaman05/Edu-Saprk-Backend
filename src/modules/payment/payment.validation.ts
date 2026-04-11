import { z } from "zod";

export const buyCreditSchema = z.object({
  planId: z.string().uuid({ message: "Invalid plan ID" }),
  successUrl: z.string().url({ message: "Invalid success URL" }),
  cancelUrl: z.string().url({ message: "Invalid cancel URL" }),
});

export const stripeWebhookSchema = z.object({
  paymentId: z.string().uuid({ message: "Invalid payment ID" }),
});
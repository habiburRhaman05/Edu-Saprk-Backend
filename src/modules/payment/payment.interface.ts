export interface IInvoicePayload {
  status: 'COMPLETE' | 'PENDING' | 'FAILED';
  invoiceNumber: string;
  userName: string;
  userEmail: string;
  paymentTime: string;
  paymentMethod: string;
  planName: string;
  credits: number;
  amount: number;
  message: string;
}

export interface BuyCreditInput {
  planId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeWebhookInput {
  paymentId: string;
}

export interface BuyCreditOutput {
  checkoutUrl: string;
  paymentId: string;
}

export interface PaymentSuccessResult {
  payment: any;
  wallet: any;
}
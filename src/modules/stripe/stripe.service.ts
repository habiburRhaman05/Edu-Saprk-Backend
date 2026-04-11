import { envConfig } from "../../config/env"
import { stripe } from "../../config/stripe"
import { ICreatePaymentSession } from "./stripe.interface"

const createBuyPlanPaymentSession = async (sessionData:ICreatePaymentSession)=>{
     const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items :[
                {
                    price_data:{
                        currency:"bdt",
                        product_data:{
                            name : `buy credit`,
                        },
                        unit_amount : sessionData.amount,
                    },
                    quantity : 1,
                }
            ],
            metadata:{
                userId : sessionData.userId,
                username : sessionData.username,
                paymentId : sessionData.paymentId,
            },
            success_url: `${envConfig.CLIENT_URL}/dashboard/payment-success/${sessionData}`,
            // cancel_url: `${envConfig.CLIENT_URL}/dashboard/patient/payment/payment-failed`,
            cancel_url: `${envConfig.CLIENT_URL}/dashboard/payment-error/${sessionData}`,
        });
        return {
            paymentUrl:session.url
        }
}

export const stripeServices = {createBuyPlanPaymentSession}
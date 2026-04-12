import { z } from "zod";

 const registerUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long"),

    email: z
      .string()
      .email("Please provide a valid email address"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters long"),

    role: z.enum(["TUTOR","STUDENT","ADMIN"],{
        errorMap:(()=> ({message: "Role must be STUDENT or TUTOR" }))
    })
  }),
});

 const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Please provide a valid email address"),

    password: z
      .string({
        required_error: "Password is required",
      })
      .min(8, "Password must be at least 8 characters long"),
  }),
});


const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Please provide a valid email address"),
    otp: z.string().min(4, "OTP is required"),
  }),
});

export const authSchemas = {
  registerUserSchema,
  loginSchema,
  verifyEmailSchema,
};
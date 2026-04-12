import { Admin, Moderator, Student, Technician, TutorProfile, User, UserRole } from "../generated/prisma/client";


declare global {
  namespace Express {
    interface Request {
      user?: {
        userId:string;
        role:UserRole
      } ,
      auth: {
        userId: string;
        email: string;
        role: UserRole
      
      }
    }
     interface Locals {
    user:Student | Admin | TutorProfile | Moderator | Technician,
      auth: {
        userId: string;
        email: string;
        role: UserRole
      }
    }
  }
}



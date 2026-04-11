import { Role } from "../../generated/prisma/enums";
import { TutorProfileResponse } from "../tutor/types";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role?: "STUDENT" | "TUTOR"; // optional, default = STUDENT
};

export type LoginPayload = {
  email: string;
  password: string;
};

export interface JwtPayload {
  userId: string;
  role: "STUDENT" | "TUTOR" | "ADMIN";
}
export interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  profileAvater:string
  role: Role;
  status: string;
  tutorProfile?: TutorProfileResponse; // only present if role = TUTOR
}
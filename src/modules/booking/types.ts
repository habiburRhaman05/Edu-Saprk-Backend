import { Role } from "../../generated/prisma/enums";

export interface TutorProfileCreatePayload {
  bio: string;
  profileAvater: string;
  subjects: string[];    
  hourlyRate: number;       
  category: string;       
  availability: string[];  
}


export interface TutorProfileUpdatePayload {
  bio?: string;
   categories:any;  
  hourlyRate?: number;
  availability?: string[];
  subjects?: string[];
}


export interface TutorProfileResponse {
  id: string;
  userId: string;
  bio: string;
  hourlyRate: number;
  category: string;
  subjects: string[];
  availability: string[];
  user?: {
     name: string;
     email: string;
     profileAvater:string
     role: Role;
     status: string;
  };
}

export interface AddAvailabilityPayload {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
}
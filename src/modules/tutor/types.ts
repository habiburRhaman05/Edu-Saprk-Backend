import { UserRole } from "../../generated/prisma/enums";

export interface TutorProfileCreatePayload {
  bio: string;
  profileAvater: string;
  subjects: string[];
  hourlyRate: number;
  categoryId: string;
  name: string;
  experience: string;
  category: string;
  availability: string[];
}

export interface TutorProfileUpdatePayload {
  bio?: string;
  category: string;
  categoryId: string;
  experience?: string;

  hourlyRate?: number;
  user: {
    name: string
    location: string;
    phoneNumber: string;
  }
  subjects?: string[];
}


export interface TutorProfileResponse {
  id: string;
  userId: string;
  bio: string;
  hourlyRate: number;
  experience: string;

  category: string;
  subjects: string[];
  availability: string[];
  user?: {
    name: string;
    email: string;
    profileAvater: string
    role: UserRole;
    status: string;
    location: string;
    phoneNumber: string;
  };
}

export interface AddAvailabilityPayload {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
}
export type TutorFilters = {
  category?: string | undefined;
  rating?: string | undefined;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  subject?: string | undefined;
  q?: string | undefined;
};

export type StatusEnum = {
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'

}
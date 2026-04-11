
export const CACHE_TTL = 60 * 5; // 5 minutes default TTL

export const ADMIN_LIST_CACHE = "admins:list";
export const DOCTOR_LIST_CACHE = "doctors:list";
export const PATIENT_LIST_CACHE = "patients:list";
export const SCHEDULE_LIST_CACHE = "schedules:list";
export const DOCTOR_SCHEDULE_LIST_CACHE = "doctor-schedules:list";

// auth keys

export const SESSION_EXPIRE = 60 * 60 * 24;
export const REFRESH_EXPIRE = 60 * 60 * 24 * 7;
export const PROFILE_CACHE_EXPIRE = 60 * 2;

// For individual entities by id
export const adminCacheById = (id: string) => `admin:${id}`;
export const doctorCacheById = (id: string) => `doctor:${id}`;
export const patientCacheById = (id: string) => `patient:${id}`;
export const scheduleCacheById = (id: string) => `schedule:${id}`;
export const doctorScheduleCacheByDoctorId = (doctorId: string) => `doctor-schedule:${doctorId}`;

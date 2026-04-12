
import { Prisma } from "../../generated/prisma/client";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { redis } from "../../config/redis";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { tokenUtils } from "../../utils/token";
import { IChangePassword, ILoginUserPayload, IRegisterPayload, IRequestUser } from "./auth.interface";

import { StatusCodes } from 'http-status-codes';
import { PROFILE_CACHE_EXPIRE } from "../../config/cacheKeys";
import { jwtUtils } from "../../utils/jwt";
import { envConfig } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { CookieUtils } from "../../utils/cookie";
export const getProfileCacheKey = (userId: string, role: string) => `profile:${userId}-${role}`;


// -------------------- REGISTER --------------------
const registerUser = async (payload: IRegisterPayload) => {
  try {
    // 1️⃣ Create user
    const { user,token } = await auth.api.signUpEmail({
      body: {
        email: payload.email,
        name: payload.name,
        password: payload.password,
        role: payload.role
      }
    });


    if(user.role === UserRole.STUDENT){
      await prisma.student.create({
        data:{
          name:user.name,
          email:user.email,
          bio:"",
          userId:user.id,
          emailVerified:user.emailVerified,
          password:payload.password,
          role:"STUDENT"
        }
      })
    }


    if(user.role === UserRole.TUTOR){
       await prisma.tutorProfile.create({
        data:{
          name:user.name,
          email:user.email,
          bio:"",
          userId:user.id,
        category:"",
        categoryId:"",
        experience:"",
        hourlyRate:0,
        profileAvatar:"",
        subjects:[]
        }
      })
    }

    return { user,token };
  } catch (error: any) {
    // 1. Prisma unique constraint error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[]) || [];
      if (target.includes("email")) {
         throw new AppError("A user with this email already exists", 409);
      }
      throw new AppError(`Duplicate field value: ${target.join(", ")}`, 409);
    }

    // 2. Auth provider duplicate error (Better Auth often uses 'user_already_exists' or similar)
    const errorMsg = error?.message?.toLowerCase() || "";
    if (
      errorMsg.includes("already") || 
      errorMsg.includes("exists") || 
      error.code === "user_already_exists"
    ) {
      throw new AppError("This email is already registered. Please sign in instead.", 409);
    }

    // ❌ fallback
    throw new AppError(
      error?.message || "Registration failed",
      error?.statusCode || 500
    );
  }
};

// -------------------- LOGIN --------------------
// const loginUser = async (payload: LoginPayload) => {
//   const { email, password } = payload;

//   const user = await prisma.user.findUnique({
//     where: { email },
//   });

//   if (!user) {
//     throw new Error("Invalid credentials");
//   }

//   if (user.status === StatusCodes.BANNED) {
//     throw new Error("User is banned");
//   }

//   const isPasswordValid = await bcrypt.compare(password, user.);
//   if (!isPasswordValid) {
//     throw new Error("Invalid credentials");
//   }
//   const token = jwt.sign(
//     { userId: user.id, role: user.role },
//     JWT_SECRET,
//     { expiresIn: "7d" }
//   );

//   // ✅ Remove password before returning user
//   const { password: _password, ...safeUser } = user;

//   return {
//     user: safeUser,
//     token,
//   };
// };

const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const attemptKey = `login_attempt:${email}`;
  const attempts = await redis.incr(attemptKey);

  if (attempts === 1) await redis.expire(attemptKey, 60);
  if (attempts > 5)
    throw new AppError("Too many login attempts", 429);

  const data = await auth.api.signInEmail({ body: { email, password } });
  console.log(data);

  if (data.user.status === UserStatus.BANNED)
    throw new AppError("User is blocked", StatusCodes.FORBIDDEN);

  if (data.user.isDeleted || data.user.status === UserStatus.DELETED)
    throw new AppError("User is deleted", StatusCodes.NOT_FOUND);

  const accessTokenPayload = {
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
  };
  const refreshTokenPayload = {
    ...accessTokenPayload,
    token: data.token
  };

  const accessToken = tokenUtils.getAccessToken(accessTokenPayload);
  const refreshToken = tokenUtils.getRefreshToken(refreshTokenPayload);
  const sessionToken = data.token;

  return { accessToken, refreshToken, sessionToken, user: data.user };
};


// -------------------- GET CURRENT USER --------------------
    const getCurrentUser = async (user: IRequestUser) => {
  const cacheKey = getProfileCacheKey(user.userId, user.role)

  // const cached = await redis.get(cacheKey);
  // if (cached) return JSON.parse(cached);
  const baseUser = await prisma.user.findUnique({
    where: {
      id: user.userId
    },
    include: { admin: true, student: true ,moderator:true,tutorProfile:true,technician:true}
  });
console.log("base",baseUser);

  if (baseUser?.role === UserRole.ADMIN) {
    const admin = await prisma.admin.findUnique({
      where: { id: baseUser?.admin?.id! }, include: {
        user: true,
      }
    });

    if (!admin)
      throw new AppError("User not found", StatusCodes.NOT_FOUND);

    await redis.set(
      cacheKey,
      JSON.stringify(admin),
      "EX",
      PROFILE_CACHE_EXPIRE
    );
    console.log("Admin logged in");
    return admin;
  } else if(baseUser?.role === UserRole.MODERATOR){
     const moderator = await prisma.moderator.findUnique({
      where: { id: baseUser?.moderator?.id! }, include: {
        user: true,
      }
    });

    if (!moderator)
      throw new AppError("User not found", StatusCodes.NOT_FOUND);

    await redis.set(
      cacheKey,
      JSON.stringify(moderator),
      "EX",
      PROFILE_CACHE_EXPIRE
    );
    console.log("Moderator logged in");
    return moderator;
  }  else if(baseUser?.role === UserRole.TUTOR){
     const tutor = await prisma.tutorProfile.findUnique({
      where: { id: baseUser?.tutorProfile?.id! }, include: {
        user: true,
      }
    });

    if (!tutor)
      throw new AppError("User not found", StatusCodes.NOT_FOUND);

    await redis.set(
      cacheKey,
      JSON.stringify(tutor),
      "EX",
      PROFILE_CACHE_EXPIRE
    );
    console.log("tutor logged in");
    return {...tutor,role:baseUser.role};
  } 
   else if(baseUser?.role === UserRole.TECHNICIAN){
     const technician = await prisma.technician.findUnique({
      where: { id: baseUser?.technician?.id! }, include: {
        user: true,
      }
    });

    if (!technician)
      throw new AppError("User not found", StatusCodes.NOT_FOUND);

    await redis.set(
      cacheKey,
      JSON.stringify(technician),
      "EX",
      PROFILE_CACHE_EXPIRE
    );
    console.log("technician logged in");
    return technician;
  } 
  else {
    const studentProfile = await prisma.student.findUnique({
      where: { id: baseUser?.student?.id! }
    });

    if (!studentProfile)
      throw new AppError("User not found", StatusCodes.NOT_FOUND);

    await redis.set(
      cacheKey,
      JSON.stringify(studentProfile),
      "EX",
      PROFILE_CACHE_EXPIRE
    );
    console.log("student logged in");
    return studentProfile;
  }
};

const isUserExist = async (userId:string,model:string) =>{
  switch (model) {
    case "USER":
      const user = await prisma.user.findUnique({
        where:{id:userId}
      });
    if(!user){
      throw new AppError("user not found")
    }
    break;
    
    case "TUTOR":
      const tutor = await prisma.tutorProfile.findUnique({
        where:{id:userId}
      });
      if(!tutor){
        throw new AppError("tutor profilr not found")
      }
      
      default:
        return null
      }
    }


    const logoutUser = async (
  sessionToken: string,
  refreshToken: string
) => {

  await redis.del(`session:${sessionToken}`);
  await redis.del(`refresh:${refreshToken}`);
  return true;
};


    
const verifyEmail = async (payload: {
  email: string;
  otp: string;
}) => {
  try {
    const { email, otp } = payload;

    // 1️⃣ Find verification record
    const record = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: otp,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!record) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    if (record.expiresAt < new Date()) {

      await prisma.verification.delete({ where: { id: record.id } });
      throw new AppError("OTP expired", 400);
    }



    if (otp !== record.value) {

      throw new AppError("Invalid OTP", 400);
    }

    // 4️⃣ Mark user as verified
    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true
      }
    });

    // 5️⃣ Delete verification record (one-time use)
    await prisma.verification.delete({
      where: { id: record.id }
    });


    return {
      success: true,
      message: "Email verified successfully",
      user
    };

  } catch (error: any) {
    throw new AppError(
      error?.message || "Email verification failed",
      error?.statusCode || 400
    );
  }
};


const updateProfile = async (updatedData: any, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { admin: true, student: true,tutorProfile:true,moderator:true,technician:true }
  });

  if (!user) throw new AppError("User not found", StatusCodes.NOT_FOUND);

  const isAdmin = user.role === UserRole.ADMIN
  const isTutor = user.role === UserRole.TUTOR
  const isStudent = user.role === UserRole.STUDENT
  let updatedProfile;

  if (isAdmin) {
    updatedProfile = await prisma.$transaction(async (ts) => {
      await ts.user.update({
        where: { id: userId },
        data: { name: updatedData.name || user.name }
      });
      return await ts.admin.update({
        where: { userId: userId },
        data: {
          name: updatedData.name || user.admin?.name,
          loaction: updatedData.location || user.admin?.loaction,
          contactNumber: updatedData.contactNumber || user.admin?.contactNumber,
        },
        include: { user: true }
      });
    });
  }

  if(isStudent){
     updatedProfile = await prisma.$transaction(async (ts) => {
      await ts.user.update({
        where: { id: userId },
        data: { name: updatedData.name || user.name }
      });
      return await ts.student.update({
        where: { userId: userId },
        data: {
          name: updatedData.name || user.student?.name,
          location: updatedData.location || user.student?.location,
          phoneNumber: updatedData.phoneNumber || user.student?.phoneNumber,
          hobbies: updatedData.phoneNumber || user.student?.hobbies,
          skills:updatedData.skills || user.student?.skills

    
        }
      });
    });
  }
  if(isTutor){
     updatedProfile = await prisma.$transaction(async (ts) => {
      await ts.user.update({
        where: { id: userId },
        data: { name: updatedData.name || user.name }
      });
      return await ts.tutorProfile.update({
        where: { userId: userId },
        data: {
          name: updatedData.name || user.tutorProfile?.name,
          bio: updatedData.bio || user.tutorProfile?.bio,
          experience: updatedData.experience || user.tutorProfile?.experience,
          hourlyRate: updatedData.hourlyRate || user.tutorProfile?.hourlyRate,
          subjects: updatedData.subjects || user.tutorProfile?.subjects,
          category: updatedData.category || user.tutorProfile?.category,
        }
      });
    });
  }
 
  // 🔥 CRITICAL FIX: Invalidate Cache after update
  const cacheKey = getProfileCacheKey(userId, user.role);
  await redis.del(cacheKey);

  return updatedProfile;
};


const changeAvatar = async (profileAvatarUrl: string, userId: string) => {


  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { image: profileAvatarUrl }
    });

      const isAdmin = user.role === UserRole.ADMIN
  const isTutor = user.role === UserRole.TUTOR
  const isStudent = user.role === UserRole.STUDENT
    if (isAdmin) {
      await tx.admin.update({
        where: { userId: userId },
        data: { profileAvatar: profileAvatarUrl }
      });
    }

    if(isStudent){
       await tx.student.update({
        where: { userId: userId },
        data: { profileAvatar: profileAvatarUrl }
      });
    }
    if(isTutor){
       await tx.tutorProfile.update({
        where: { userId: userId },
        data: { profileAvatar: profileAvatarUrl }
      });
    }

    return user;
  });

  // 🔥 CRITICAL FIX: Invalidate Cache
  const cacheKey = getProfileCacheKey(userId, result.role);
  await redis.del(cacheKey);
  console.log("avater chnages");

  return result;
};


const changePassword = async (payload: IChangePassword) => {



  const session = await prisma.session.findUnique({
    where: {
      token: payload.sessionToken
    },
    include: {
      user: {
        include: {
          accounts: true
        }
      }
    }
  });

  if (payload.currentPassword === payload.newPassword) {
    throw new AppError("New password cannot be the same as the current password", 400);
  }

  const updatedUser = await auth.api.changePassword({
    headers: new Headers({
      Authorization: `Bearer ${payload.sessionToken}`,
    }),
    body: {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    },
  });

  return updatedUser;
};



// const sendOtp = async (payload: {
//   email: string;
//   name: string;
//   type: VerificationType;
//   expiration?: number;
// }) => {
//   const { email, name, type, expiration = 5 } = payload;

//   try {
//     // 1️⃣ Generate OTP + hash
//     const otp = generateOTP();
//     const tokenHash = await hashOTP(otp);
//     const expiresAt = getExpiry(expiration);
//     const isMatch = await bcrypt.compare(otp, tokenHash);
//     console.log(isMatch, otp, tokenHash);
//     // 2️⃣ DB operations (fast transaction)
//     await prisma.$transaction(async (tx) => {
//       await tx.verification.deleteMany({
//         where: {
//           identifier: email,
//           type
//         }
//       });

//       await tx.verification.create({
//         data: {
//           identifier: email,
//           value: otp,
//           type,
//           expiresAt
//         }
//       });
//     });

//     // 3️⃣ Send email (outside transaction)
//     await emailQueue.add("verify-email", {
//       user: { name, email },
//       otp,
//       expiryMinutes: expiration
//     });

//     return { success: true };

//   } catch (error: any) {
//     throw new AppError(
//       error?.message || "Failed to send OTP",
//       error?.statusCode || 500
//     );
//   }
// };


// const resendOtp = async (email: string, type: VerificationType = VerificationType.EMAIL_VERIFY) => {
//   // 1️⃣ Check user exists
//   const user = await prisma.user.findUnique({ where: { email } });
//   if (!user) throw new AppError("User not found", 404);

//   // 2️⃣ Optional: Check cooldown (30s–1min)
//   const lastOtp = await prisma.verification.findFirst({
//     where: { identifier: email, type },
//     orderBy: { createdAt: "desc" }
//   });

//   if (lastOtp && lastOtp.createdAt.getTime() + 30_000 > Date.now()) {
//     throw new AppError("Please wait before requesting a new OTP", 429);
//   }

//   // 3️⃣ Reuse sendOtp service
//   await sendOtp({
//     email: user.email,
//     name: user.name,
//     type,
//     expiration: 5
//   });

//   return true
// };

const getAllNewTokens = async (
  refreshToken: string,
) => {


  const verifiedRefreshToken = jwtUtils.verifyToken(refreshToken, envConfig.REFRESH_TOKEN_SECRET)


  if (!verifiedRefreshToken.success && verifiedRefreshToken.error) {
    throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }

  const data = verifiedRefreshToken.data as JwtPayload;


  const isSessionTokenExists = await prisma.session.findUnique({
    where: {
      token: data.token,
    },
    include: {
      user: true,
    }
  })

  if (!isSessionTokenExists) {
    throw new AppError("Invalid session token", StatusCodes.UNAUTHORIZED);
  }

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
    token: isSessionTokenExists.token
  });

  const { token } = await prisma.session.update({
    where: {
      token: data.token
    },
    data: {
      token: data.token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      updatedAt: new Date(),
    }
  })

  console.log("token updated");


  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  }

};




    export const authServices = {isUserExist,registerUser,loginUser,getCurrentUser,updateProfile,changeAvatar,changePassword,verifyEmail,getAllNewTokens,logoutUser}
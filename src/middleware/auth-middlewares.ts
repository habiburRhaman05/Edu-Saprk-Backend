import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

import { sendError } from "../utils/apiResponse";
import { CookieUtils } from "../utils/cookie";
import { UserRole } from "../generated/prisma/enums";
import { Student } from "../generated/prisma/client";


export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = 
      CookieUtils.getCookie(req, "better-auth.session_token") || 
      (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
   

    if (!sessionToken) {
      return sendError(res, {
        message: "Unauthorized: No session token provided",
        statusCode: 401
      });
    }
    
   const token = sessionToken.split(".")[0];
    const sessionData = await prisma.session.findUnique({
      where: {
        token: token,
        expiresAt: { gt: new Date() }
      },
      
      include: { user: {
        include:{admin:true,moderator:true,technician:true,tutorProfile:true,student:true}
      } }
    });
 
    if (!sessionData || !sessionData.user) {
      return sendError(res, {
        message: "Unauthorized: Invalid or expired session",
        statusCode: 401
      });
    }

    const { user } = sessionData;

console.log(user);


    if (user.status === "BANNED" || user.status === "DELETED" || user.isDeleted) {
      return sendError(res, {
        message: `Unauthorized: Account is ${user.status.toLowerCase()}`,
        statusCode: 403
      });
    }

    const now = new Date().getTime();
    const expiresAt = new Date(sessionData.expiresAt).getTime();
    const createdAt = new Date(sessionData.createdAt).getTime();

    const totalLifetime = expiresAt - createdAt;
    const remainingTime = expiresAt - now;
    const percentRemaining = (remainingTime / totalLifetime) * 100;

    if (percentRemaining < 20) {
      res.setHeader('X-Session-Refresh', 'true');
      res.setHeader('X-Session-Expires-At', sessionData.expiresAt.toISOString());
    }
    req.user = {
      userId: user.id, // base user id
      role: user.role as UserRole,
    };


    res.locals.auth = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };
    res.locals.user = 
      (user.role === UserRole.USER || user.role === UserRole.STUDENT) ? user.student : 
      user.role === UserRole.MODERATOR ? user.moderator : 
      user.role === UserRole.TUTOR ? user.tutorProfile : 
      user.role === UserRole.TECHNICIAN ? user.technician : 
      user.admin;
      
    console.log("Resolved res.locals.user:", res.locals.user);

    return next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during authentication"
    });
  }
}

export function roleMiddleware(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.user 
    if (!auth || !allowedRoles.includes(auth.role)) {
      return sendError(res,{
          errors: true,
        message: "Forbidden: You do not have permission to perform this action", 
      statusCode:403
      })
    }

    next();
  };
}
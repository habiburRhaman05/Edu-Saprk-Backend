import type { Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { authServices } from "./auth.service";
import { CookieUtils } from "../../utils/cookie";
import { tokenUtils } from "../../utils/token";
import { envConfig } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { auth } from "../../lib/auth";
import { StatusCodes } from 'http-status-codes';
const isProduction = envConfig.NODE_ENV === "production";

// -------------------- REGISTER --------------------
const registerController = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password ,role} = req.body;

  const result = await authServices.registerUser({
    name, email, password,role
  })
  return sendSuccess(res, {
    statusCode: 201,
    data: result,
    message: " User Account Created Successfully"
  })
});

// -------------------- LOGIN --------------------
const loginController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  ;

  const data = await authServices.loginUser({ email, password })

  tokenUtils.setAccessTokenCookie(res, data.accessToken)
  tokenUtils.setRefreshTokenCookie(res, data.refreshToken)
  tokenUtils.setBetterAuthSessionCookie(res, data.sessionToken)

  return sendSuccess(res, {
    statusCode: 200,
    data,
    message: "your are LoggedIn Sucessfully"
  })
});
// -------------------- PROFILE DATA --------------------
const getUserProfileController = asyncHandler(async (req: Request, res: Response) => {
  console.log(res.locals.user);
  
  const user = await authServices.getCurrentUser(res.locals.auth)
  return sendSuccess(res, {
    data: user,
    message: "Profile Data fetch Successfully"
  })
});

// -------------------- LOGOUT --------------------
const logoutUserController = asyncHandler(async (req: Request, res: Response) => {


  const better_auth_session_token = req.cookies["better-auth.session_token"]
  const refreshToken = req.cookies["refreshToken"]

  const user = await authServices.logoutUser(better_auth_session_token,refreshToken)
  CookieUtils.clearCookie(res, "accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: '/',
    maxAge: 15 * 60 * 1000,
  })
  CookieUtils.clearCookie(res, "refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  CookieUtils.clearCookie(res, "better-auth.session_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: '/',
    maxAge: 24 * 60 * 60 * 1000,
  })
  return sendSuccess(res, {
    statusCode: 200,
    data: user,
    message: "User Logout Successfully"
  })
});
// -------------------- CHANGE PASSWORD --------------------
const changePasswordController = asyncHandler(async (req: Request, res: Response) => {

console.log(req.body);


  const better_auth_session_token = req.cookies["better-auth.session_token"];

  const { currentPassword, newPassword } = req.body

  const user = await authServices.changePassword({
    sessionToken: better_auth_session_token,
    currentPassword,
    newPassword
  })

  console.log("ssuccess");
  
  return sendSuccess(res, {
    statusCode: 200,
    data: user,
    message: "Password change Successfully"
  })
});
// -------------------- REFRESH TOKEN --------------------
const getRefreshTokenController = asyncHandler(async (req: Request, res: Response) => {



  const refreshToken = req.cookies.refreshToken;
 
  if (!refreshToken) {
    throw new AppError("Refresh token is missing",StatusCodes.UNAUTHORIZED);
  }

  // const  {cookie,token} = req.body;
  const result = await authServices.getAllNewTokens(refreshToken)
  // console.log(sessionToken);

  tokenUtils.setAccessTokenCookie(res, result.accessToken)
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken)
  tokenUtils.setBetterAuthSessionCookie(res, result.sessionToken)

  return sendSuccess(res, {
    statusCode: 201,
    message: "refresh token generate Successfully",
    data: result
  })
});


// --------------------  VERIFY EMAIL --------------------
const verifyEmail = asyncHandler(async (req, res) => {

  const {email,otp} = req.body;
   await authServices.verifyEmail({email,otp})


   return sendSuccess(res,{
    message:"Your email verification is successfull",
    statusCode:200
   })
 
})

// --------------------  CHANGE AVATAR --------------------
const changeProfileAvatar = asyncHandler(async (req, res) => {
        const payload = {
          profileAvatarUrl:req.body.profileAvatar,
          userId:res.locals.auth.userId,
        };
        console.log(payload);
        
        const updatedResult = await authServices.changeAvatar(payload.profileAvatarUrl,payload.userId)
        console.log("chnage both");
        
        return sendSuccess(res,{
          data:updatedResult,
          message:"Your Profile Avatar Change Successfully"
        })
})
// --------------------  UPDATE PROFILE --------------------
const updateProfileInfo = asyncHandler(async (req, res) => {
  
         const userId =res.locals.auth.userId
        
        const updatedResult = await authServices.updateProfile(req.body,userId)
        return sendSuccess(res,{
          data:updatedResult,
          message:"Your Profile Updated Successfully"
        })
})





export const authControllers = {
  registerController, loginController, getUserProfileController, logoutUserController,
  changePasswordController,
  getRefreshTokenController,
  verifyEmail,
  updateProfileInfo,changeProfileAvatar,
};

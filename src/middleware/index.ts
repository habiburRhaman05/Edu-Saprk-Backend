import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import hpp from "hpp";
import { rateLimit } from "express-rate-limit";
import { corsConfig } from "../config/cors";



export const applyMiddleware = (app: Express): void => {
  app.use(cors(corsConfig));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({
  verify: (req:any, res, buf) => {
   if (req.originalUrl.includes('/stripe/webhook')) {
      req.rawBody = buf;
    }
  }
}));
};

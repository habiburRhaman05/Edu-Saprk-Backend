import Groq from "groq-sdk";
import { envConfig } from "../config/env";


export const groq = new Groq({
  apiKey: envConfig.GROQ_API_KEY,
});
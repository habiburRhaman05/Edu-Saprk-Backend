

import { v2 as cloudinary } from "cloudinary";
import { envConfig } from "./env";

export const configureCloudinary = async () => {
  cloudinary.config({
    cloud_name: envConfig.CLOUDINARY_NAME,
    api_key: envConfig.CLOUDINARY_KEY,
    api_secret: envConfig.CLOUDINARY_SECRET,
  });

  try {
    await cloudinary.api.ping();
    console.log("✅ Cloudinary Connected Successfully");
  } catch (error) {
    console.log("not connected");
    
    console.error("❌ Cloudinary Connection Failed:", error);
    process.exit(1); 
  }
};

// Export the ACTUAL cloudinary instance, not the function
export const cloudinaryInstance = cloudinary;
export default cloudinary;

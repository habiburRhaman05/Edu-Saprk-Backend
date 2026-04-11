import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import  cloudinaryInstance  from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryInstance,
  params: async (req: any, file: any): Promise<any> => {
    console.log("uploading");
    
    // 1. Payload extract (Ensure text fields are sent BEFORE files in Postman)
    const userId = req.body?.userId || "anonymous";
    const uploadType = req.body?.uploadType || "general"; // e.g., 'avatar'

    let folderPath;
    let resource_type = "image";
    const options: any = {
      overwrite: true, 
      invalidate: true, 
    };

    // 2. Resource & Transformation Logic
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      resource_type = "image";
      folderPath="images"
      options.format = "webp";
      options.transformation = [{ width: 1024, height: 1024, crop: "limit" }];
    } else if (file.mimetype === "application/pdf") {
      resource_type = "raw";
      folderPath="documents"

    }
    const publicId = `${userId}_${uploadType}`;
    console.log("done");
    
    return {
      folder: `blitz-analyzer/${folderPath}`,
      resource_type,
      public_id: publicId,
      ...options,
    };
  },
});

export const multerUploader = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP, and PDF are allowed"));
    }
    cb(null, true);
  },
});
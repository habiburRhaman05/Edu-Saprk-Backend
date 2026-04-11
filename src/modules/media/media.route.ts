import { Router } from "express";

import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";
import { sendSuccess } from "../../utils/apiResponse";
import { multerUploader } from "../../config/multer.config";
import { UserRole } from "../../generated/prisma/enums";

const mediaRouter = Router();


mediaRouter.post("/upload-avatar",authMiddleware,roleMiddleware([UserRole.ADMIN,UserRole.STUDENT,UserRole.TUTOR,UserRole.MODERATOR,UserRole.TECHNICIAN]), multerUploader.fields([
    { name: "avatar", maxCount: 1 }
]), (req, res) => {
    // req.files holo ekta object jar moddhe array thake
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    // 'avatar' field theke prothom file ta nao
    const avatarFile = files?.['avatar'] ? files['avatar'][0] : null;
    if (!avatarFile) {
        return res.status(400).json({ message: "No avatar uploaded!" });
    }
    console.log(avatarFile);
    
    return sendSuccess(res,{
        data:{
        secure_url: avatarFile.path,    // Cloudinary URL
        public_id: avatarFile.filename, // Cloudinary Public ID
    },
    statusCode:201
    })
});

mediaRouter.post("/upload-images",multerUploader.fields([
    {name:"images",maxCount:5}
]),(req,res)=>{
const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // ২. Multiple Files (Documents) - Loop chaliye data nite hobe
    const images = files?.['images']?.map(file => ({
        url: file.path,
        id: file.filename,
        originalName: file.originalname
    })) || [];

    res.json({
   
     images
    });
})

export default mediaRouter
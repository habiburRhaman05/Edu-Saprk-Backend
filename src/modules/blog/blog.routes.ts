import { Router } from "express";
import { blogController } from "./blog.controller";
import {validateRequest} from "../../middleware/validateRequest";
import {
  createBlogSchema,
  updateBlogSchema,
  blogIdParamsSchema,
  getBlogsQuerySchema,
} from "./blog.validation";
import { authMiddleware, roleMiddleware } from "../../middleware/auth-middlewares";

const router = Router();

router.post("/",
    
    authMiddleware,
    roleMiddleware(["MODERATOR"]),
    // validateRequest(createBlogSchema)
     blogController.createBlog);

router.get("/", validateRequest(getBlogsQuerySchema,), blogController.getAllBlogs);

router.get("/:blogId", validateRequest(blogIdParamsSchema,), blogController.getBlogById);

router.patch(
  "/:blogId",
   authMiddleware,
    roleMiddleware(["MODERATOR"]),
  validateRequest(blogIdParamsSchema,),
  validateRequest(updateBlogSchema),
  blogController.updateBlog
);

router.delete(
  "/:blogId",
   authMiddleware,
    roleMiddleware(["MODERATOR"]),
  validateRequest(blogIdParamsSchema,),
  blogController.deleteBlog
);

export default router;
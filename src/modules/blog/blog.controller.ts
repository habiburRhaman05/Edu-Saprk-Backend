import { Request, Response } from "express";

import { blogServices } from "./blog.services";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { BlogStatus } from "../../generated/prisma/enums";

const createBlog = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body);
    
  const result = await blogServices.createBlog({...req.body,authorId:res.locals.user.id});
  return sendSuccess(res, {
    statusCode: 201,
    data: result,
    message: "Blog created successfully",
  });
});

const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;

  const result = await blogServices.updateBlog(blogId, req.body);

  return sendSuccess(res, {
    statusCode: 200,
    data: result,
    message: "Blog updated successfully",
  });
});

const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;

  await blogServices.deleteBlog(blogId);

  return sendSuccess(res, {
    statusCode: 200,
    data: null,
    message: "Blog deleted successfully",
  });
});

const getAllBlogs = asyncHandler(async (req: Request, res: Response) => {
  const statusParam = req.query.status
    ? (req.query.status as BlogStatus)
    : BlogStatus.PUBLISHED;

const result = await blogServices.getAllBlogs({
  page: Number(req.query.page) || 1,
  limit: Number(req.query.limit) || 10,
  search: req.query.search ? String(req.query.search) : undefined,
  status: statusParam,
  category: req.query.category ? String(req.query.category) : undefined,
  authorId: req.query.authorId ? String(req.query.authorId) : undefined,
});

  return sendSuccess(res, {
    statusCode: 200,
    data: result,
    message: "Blogs fetched successfully",
  });
});

const getBlogById = asyncHandler(async (req: Request, res: Response) => {
  const { blogId } = req.params;
console.log(blogId);

  const result = await blogServices.getBlogById(blogId);

  return sendSuccess(res, {
    statusCode: 200,
    data: result,
    message: "Blog fetched successfully",
  });
});

export const blogController = {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
};
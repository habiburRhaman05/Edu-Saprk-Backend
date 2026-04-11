import { z } from "zod";

const blogStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);

export const createBlogSchema = z.object({
  title: z.string().min(5).max(200),
  excerpt: z.string().optional().nullable(),
  fullContent: z.string().min(20),
  seoTags: z.any().optional(),
  category: z.string().optional().nullable(),
  status: blogStatusEnum.optional(),
  thumbnail: blogStatusEnum.optional(),
});

export const updateBlogSchema = z
  .object({
    title: z.string().min(5).optional(),
    excerpt: z.string().optional().nullable(),
    fullContent: z.string().min(20).optional(),
    seoTags: z.any().optional(),
    category: z.string().optional().nullable(),
    status: blogStatusEnum.optional(),
    publishedAt: z.coerce.date().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });

export const blogIdParamsSchema = z.object({
  blogId: z.string(),
});

export const getBlogsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
  status: blogStatusEnum.optional(),
  category: z.string().optional(),
  authorId: z.string().optional(),
});
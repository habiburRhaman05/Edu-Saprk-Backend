import { redis } from "../../config/redis";
import { Prisma } from "../../generated/prisma/client";
import { BlogStatus } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateBlogPayload,
  IUpdateBlogPayload,
  IGetBlogsQuery,
} from "./blog.interface";
import slugify from "slugify";

const CACHE_TTL = 120;

const generateSlug = async (title: string) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.blog.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

const buildListCacheKey = (query: IGetBlogsQuery) => {
  return `blogs:${JSON.stringify(query)}`;
};

const buildSingleCacheKey = (id: string) => {
  return `blog:${id}`;
};

const invalidateBlogCache = async (id?: string) => {
  const keys = await redis.keys("blogs:*");
  if (keys.length) await redis.del(keys);

  if (id) {
    await redis.del(buildSingleCacheKey(id));
  }
};

const createBlog = async (payload: ICreateBlogPayload) => {
  try {
    console.log("payload",payload);
    
 
    const blog = await prisma.blog.create({
      data: {
        title:payload.title,
        slug:payload.slug,
        status: payload.status ?? BlogStatus.DRAFT,
        thumbnail:payload.thumbnail! || "",
        fullContent:payload.fullContent,
        authorId:payload.authorId
      },
    });

    await invalidateBlogCache();

    return blog;
  } catch (error: any) {
    throw new AppError(error.message || "Failed to create blog", 500);
  }
};

const updateBlog = async (blogId: string, payload: IUpdateBlogPayload) => {
  const existing = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!existing) throw new AppError("Blog not found", 404);

  let slug;
  if (payload.title && payload.title !== existing.title) {
    slug = await generateSlug(payload.title);
  }

  const updated = await prisma.blog.update({
    where: { id: blogId },
    data: {
      ...payload,
      ...(slug && { slug }),
      ...(payload.status === "PUBLISHED" && !existing.publishedAt
        ? { publishedAt: new Date() }
        : {}),
    },
  });

  await invalidateBlogCache(blogId);

  return updated;
};

const deleteBlog = async (blogId: string) => {
  const exists = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!exists) throw new AppError("Blog not found", 404);

  const deleted = await prisma.blog.delete({
    where: { id: blogId },
  });

  await invalidateBlogCache(blogId);

  return deleted;
};

const getAllBlogs = async (query: IGetBlogsQuery) => {
  const cacheKey = buildListCacheKey(query);

//   const cached = await redis.get(cacheKey);
//   if (cached) return JSON.parse(cached);

  const { page = 1, limit = 10, search, status, category, authorId } = query;

  const skip = (page - 1) * limit;
  const filters: Prisma.BlogWhereInput[] = [];

  if (query.status) filters.push({ status: query.status });
  if (query.category) filters.push({ category: query.category });
  if (authorId) filters.push({ authorId });

  const term = search?.trim();
  if (term) {
    filters.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { excerpt: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.BlogWhereInput = filters.length > 0 ? { AND: filters } : {};

  const [total, blogs] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        _count: { select: { comments: true } },
      },
    }),
  ]);

  const result = {
    data: blogs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };

//   await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL);

  return result;
};

const getBlogById = async (blogId: string) => {
  const cacheKey = buildSingleCacheKey(blogId);

  const cached = await redis.get(cacheKey);
  console.log(cached);
  
  if (cached) return JSON.parse(cached);

  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      author: true,
      
    },
  });

  
  if (!blog) throw new AppError("Blog not found", 404);

  await redis.set(cacheKey, JSON.stringify(blog), "EX", CACHE_TTL);

  return blog;
};

export const blogServices = {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
};
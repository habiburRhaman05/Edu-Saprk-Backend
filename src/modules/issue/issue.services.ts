

import { Prisma } from "../../generated/prisma/client";
import { IssueStatus, IssueType } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ICreateIssuePayload,
  IGetIssuesQuery,
  IGetIssuesResult,
  IUpdateIssuePayload,
} from "./issue.interface";

const createIssue = async (payload: ICreateIssuePayload) => {
  try {
    const issue = await prisma.issue.create({
      data: {
        title: payload.title,
        username: payload.username,
        description: payload.description,
        userMessage: payload.userMessage,
        type: payload.type ?? IssueType.ISSUE,
        status: payload.status ?? IssueStatus.PENDING,
        location: payload.location ?? null,
        imageUrl: payload.imageUrl ?? null,
        adminFeedback: payload.adminFeedback ?? null,
      },
    });

    return issue;
  } catch (error: any) {
    throw new AppError(error?.message || "Failed to create issue", error?.statusCode || 500);
  }
};

const updateIssue = async (issueId: string, payload: IUpdateIssuePayload) => {
  try {
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!existingIssue) {
      throw new AppError("Issue not found", 404);
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.username !== undefined ? { username: payload.username } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.userMessage !== undefined ? { userMessage: payload.userMessage } : {}),
        ...(payload.type !== undefined ? { type: payload.type } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.location !== undefined ? { location: payload.location } : {}),
        ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl } : {}),
        ...(payload.adminFeedback !== undefined ? { adminFeedback: payload.adminFeedback } : {}),
      },
    });

    return updatedIssue;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AppError("Issue not found", 404);
    }

    throw new AppError(error?.message || "Failed to update issue", error?.statusCode || 500);
  }
};

const deleteIssue = async (issueId: string) => {
  try {
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true },
    });

    if (!existingIssue) {
      throw new AppError("Issue not found", 404);
    }

    const deletedIssue = await prisma.issue.delete({
      where: { id: issueId },
    });

    return deletedIssue;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new AppError("Issue not found", 404);
    }

    throw new AppError(error?.message || "Failed to delete issue", error?.statusCode || 500);
  }
};

const getAllIssues = async (
  query: IGetIssuesQuery
): Promise<IGetIssuesResult<any>> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      location,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.IssueWhereInput = {
      AND: [
        type ? { type } : {},
        status ? { status } : {},
        location ? { location: { contains: location, mode: "insensitive" } } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { userMessage: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [total, issues] = await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          replies: {
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { replies: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: issues,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error: any) {
    throw new AppError(error?.message || "Failed to fetch issues", error?.statusCode || 500);
  }
};

const getIssueById = async (issueId: string) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!issue) {
      throw new AppError("Issue not found", 404);
    }

    return issue;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(error?.message || "Failed to fetch issue", error?.statusCode || 500);
  }
};

export const issueServices = {
  createIssue,
  updateIssue,
  deleteIssue,
  getAllIssues,
  getIssueById,
};
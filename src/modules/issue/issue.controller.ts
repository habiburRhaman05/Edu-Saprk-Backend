import { Request, Response } from "express";

import { issueServices } from "./issue.services";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

const createIssueController = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    username,
    description,
    userMessage,
    type,
    status,
    location,
    imageUrl,
    adminFeedback,
  } = req.body;

  const result = await issueServices.createIssue({
    title,
    username,
    description,
    userMessage,
    type,
    status,
    location,
    imageUrl,
    adminFeedback,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: result,
    message: "Issue created successfully",
  });
});

const updateIssueController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;
  const {
    title,
    username,
    description,
    userMessage,
    type,
    status,
    location,
    imageUrl,
    adminFeedback,
  } = req.body;

  const result = await issueServices.updateIssue(issueId as string, {
    title,
    username,
    description,
    userMessage,
    type,
    status,
    location,
    imageUrl,
    adminFeedback,
  });

  return sendSuccess(res, {
    statusCode: 200,
    data: result,
    message: "Issue updated successfully",
  });
});

const deleteIssueController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;

  await issueServices.deleteIssue(issueId);

  return sendSuccess(res, {
    statusCode: 200,
    data: null,
    message: "Issue deleted successfully",
  });
});

const getAllIssuesController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, type, status, location } = req.query as any;

  const result = await issueServices.getAllIssues({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    search: search ? String(search) : undefined,
    type: type ? String(type) : undefined,
    status: status ? String(status) : undefined,
    location: location ? String(location) : undefined,
  });

  return sendSuccess(res, {
    statusCode: 200,
    data: result,
    message: "Issues fetched successfully",
  });
});

const getIssueByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { issueId } = req.params;

  const result = await issueServices.getIssueById(issueId);

  return sendSuccess(res, {
    statusCode: 200,
    data: result,
    message: "Issue fetched successfully",
  });
});

export const issueController = {
  createIssueController,
  updateIssueController,
  deleteIssueController,
  getAllIssuesController,
  getIssueByIdController,
};
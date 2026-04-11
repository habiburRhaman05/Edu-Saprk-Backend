import { z } from "zod";

const issueTypeEnum = z.enum(["ISSUE", "IMPROVEMENT", "FEEDBACK"]);
const issueStatusEnum = z.enum(["PENDING", "SUCCESS"]);

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  username: z.string().min(1, "Username is required").max(100, "Username is too long"),
  description: z.string().min(1, "Description is required"),
  userMessage: z.string().min(1, "User message is required"),
  type: issueTypeEnum.optional(),
  status: issueStatusEnum.optional(),
  location: z.string().max(200, "Location is too long").optional().nullable(),
  imageUrl: z.string().url("Please provide a valid image URL").optional().nullable(),
  adminFeedback: z.string().optional().nullable(),
});

export const updateIssueSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty").max(200).optional(),
    username: z.string().min(1, "Username cannot be empty").max(100).optional(),
    description: z.string().min(1, "Description cannot be empty").optional(),
    userMessage: z.string().min(1, "User message cannot be empty").optional(),
    type: issueTypeEnum.optional(),
    status: issueStatusEnum.optional(),
    location: z.string().max(200).optional().nullable(),
    imageUrl: z.string().url("Please provide a valid image URL").optional().nullable(),
    adminFeedback: z.string().optional().nullable(),
  })
  .refine(
    (data) =>
      Object.keys(data).some((key) => data[key as keyof typeof data] !== undefined),
    {
      message: "At least one field is required to update an issue",
    }
  );

export const issueIdParamsSchema = z.object({
  issueId: z.string().min(1, "Issue ID is required"),
});

export const getIssuesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  type: issueTypeEnum.optional(),
  status: issueStatusEnum.optional(),
  location: z.string().optional(),
});

export type TCreateIssueInput = z.infer<typeof createIssueSchema>;
export type TUpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type TIssueIdParams = z.infer<typeof issueIdParamsSchema>;
export type TGetIssuesQuery = z.infer<typeof getIssuesQuerySchema>;
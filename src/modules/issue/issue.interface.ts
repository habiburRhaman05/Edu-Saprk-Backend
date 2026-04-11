import { IssueStatus, IssueType } from "@prisma/client";

export interface ICreateIssuePayload {
  title: string;
  username: string;
  description: string;
  userMessage: string;
  type?: IssueType;
  location?: string | null;
  imageUrl?: string | null;
  adminFeedback?: string | null;
  status?: IssueStatus;
}

export interface IUpdateIssuePayload {
  title?: string;
  username?: string;
  description?: string;
  userMessage?: string;
  type?: IssueType;
  status?: IssueStatus;
  location?: string | null;
  imageUrl?: string | null;
  adminFeedback?: string | null;
}

export interface IGetIssuesQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: IssueType;
  status?: IssueStatus;
  location?: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IGetIssuesResult<T> {
  data: T[];
  meta: IPaginationMeta;
}
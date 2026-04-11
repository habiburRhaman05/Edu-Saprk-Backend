import { Router } from "express";
import { issueController } from "./issue.controller";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createIssueSchema,
  getIssuesQuerySchema,
  issueIdParamsSchema,
  updateIssueSchema,
} from "./issue.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createIssueSchema),
  issueController.createIssueController
);

router.get(
  "/",
  validateRequest(getIssuesQuerySchema),
  issueController.getAllIssuesController
);

router.get(
  "/:issueId",
  validateRequest(issueIdParamsSchema),
  issueController.getIssueByIdController
);

router.patch(
  "/:issueId",
  validateRequest(issueIdParamsSchema ),
  validateRequest(updateIssueSchema),
  issueController.updateIssueController
);

router.delete(
  "/:issueId",
  validateRequest(issueIdParamsSchema),
  issueController.deleteIssueController
);

export default router;
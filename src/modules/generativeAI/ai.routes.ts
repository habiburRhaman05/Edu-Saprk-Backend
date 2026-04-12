import { Router, Request, Response } from "express";
import { BaseRequestSchema } from "./ai.schemas";
import { generateContent } from "./ai.service";

const router = Router();

router.post("/generate", async (req: Request, res: Response) => {
  const parsed = BaseRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await generateContent(parsed.data);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: "AI generation failed",
      message: error?.message || "Unknown error",
    });
  }
});

export default router;
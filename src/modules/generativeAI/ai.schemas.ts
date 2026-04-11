import { z } from "zod";

export const ModeSchema = z.enum([
  "blog",
  "template",
  "resume",
  "review",
  "search",
  "chat",
]);

export const BaseRequestSchema = z.object({
  mode: ModeSchema,
  context: z.record(z.any()).default({}),
  data: z.record(z.any()).default({}),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
});

export const BlogOutputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  outline: z.array(z.string()),
  full_content: z.string(),
  seo_tags: z.array(z.string()),
  call_to_action: z.string(),
});

export const TemplateOutputSchema = z.object({
  template_name: z.string(),
  slug: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  sections: z.array(
    z.object({
      section_name: z.string(),
      purpose: z.string(),
      fields: z.array(z.string()),
    })
  ),
  sample_content: z.object({
    title: z.string(),
    subtitle: z.string(),
    body: z.string(),
  }),
});

export const ResumeOutputSchema = z.object({
  headline: z.string(),
  professional_summary: z.string(),
  skills_section: z.array(z.string()),
  experience_bullets: z.array(z.string()),
  project_bullets: z.array(z.string()),
  ats_keywords: z.array(z.string()),
  fill_missing_suggestions: z.array(z.string()),
});

export const ReviewOutputSchema = z.object({
  polished_message: z.string(),
  short_version: z.string(),
  formal_version: z.string(),
  tone: z.string(),
});

export const SearchOutputSchema = z.object({
  query_normalized: z.string(),
  results: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      matched_tags: z.array(z.string()),
      score: z.number(),
      reason: z.string(),
    })
  ),
});

export const ChatOutputSchema = z.object({
  answer: z.string(),
  next_action: z.string(),
  quick_replies: z.array(z.string()),
});

export const MetaSchema = z.object({
  provider: z.literal("groq"),
  model: z.string(),
  promptVersion: z.string(),
  generatedAt: z.string(),
  durationMs: z.number(),
  source: z.enum(["groq", "fallback"]),
});

export const GenerateContentResponseSchema = z.object({
  ok: z.literal(true),
  mode: ModeSchema,
  context: z.record(z.any()),
  input: z.record(z.any()),
  output: z.any(),
  meta: MetaSchema,
});

export type GenerateContentRequest = z.infer<typeof BaseRequestSchema>;
export type GenerateMode = z.infer<typeof ModeSchema>;

export type BlogOutput = z.infer<typeof BlogOutputSchema>;
export type TemplateOutput = z.infer<typeof TemplateOutputSchema>;
export type ResumeOutput = z.infer<typeof ResumeOutputSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
export type SearchOutput = z.infer<typeof SearchOutputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
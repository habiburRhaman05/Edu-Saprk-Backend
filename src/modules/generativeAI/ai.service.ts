
import {
  ChatOutputSchema,
  GenerateContentResponseSchema,
  GenerateMode,
  BlogOutputSchema,
  TemplateOutputSchema,
  ResumeOutputSchema,
  ReviewOutputSchema,
  SearchOutputSchema,
} from "../generativeAI/ai.schemas";
import { buildFallbackOutput } from "../../utils/fallback";
import { safeJsonParse } from "../../utils/json";
import { buildSystemPrompt, buildUserPrompt } from "../../utils/prompts/build-prompt";
import { groq } from "../../utils/groq";
import { envConfig } from "../../config/env";
import { PROMPT_VERSION } from "./ai.constant";

type AnyObject = Record<string, unknown>;

const MODE_SCHEMAS = {
  blog: BlogOutputSchema,
  template: TemplateOutputSchema,
  resume: ResumeOutputSchema,
  review: ReviewOutputSchema,
  search: SearchOutputSchema,
  chat: ChatOutputSchema,
} as const;

export async function generateContent(params: {
  mode: GenerateMode;
  context?: AnyObject;
  data?: AnyObject;
  timeoutMs?: number;
}) {
  const start = Date.now();
  const mode = params.mode;
  const context = params.context ?? {};
  const data = params.data ?? {};
  const timeoutMs = params.timeoutMs ?? 20000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await groq.chat.completions.create(
      {
        model: envConfig.GROQ_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(),
          },
          {
            role: "user",
            content: buildUserPrompt(mode, context, data),
          },
        ],
      },
      {
        signal: controller.signal,
      }
    );

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const parsed = safeJsonParse<unknown>(raw);

    const schema = MODE_SCHEMAS[mode];
    const validated = schema.parse(parsed);

    const payload = {
      ok: true as const,
      mode,
      context,
      input: data,
      output: validated,
      meta: {
        provider: "groq" as const,
        model: envConfig.GROQ_MODEL,
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        source: "groq" as const,
      },
    };

    return GenerateContentResponseSchema.parse(payload);
  } catch (error) {
    const fallbackOutput = buildFallbackOutput(mode, data);

    const payload = {
      ok: true as const,
      mode,
      context,
      input: data,
      output: fallbackOutput,
      meta: {
        provider: "groq" as const,
        model: envConfig.GROQ_MODEL,
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        source: "fallback" as const,
      },
    };

    return GenerateContentResponseSchema.parse(payload);
  } finally {
    clearTimeout(timer);
  }
}
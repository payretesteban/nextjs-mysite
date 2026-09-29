import { unstable_cache } from "next/cache";
import { createRateLimiter } from "@/lib/rateLimit";
import { encodeAnswers, parseAnswers } from "@/lib/scope/options";
import { estimate, templateSummary } from "@/lib/scope/estimate";
import { SUMMARY_SCHEMA, buildSummaryPrompt, parseSummary } from "@/lib/scope/summary";
import { askGeminiJson, geminiModelsFromEnv } from "@/lib/gemini";
import { GeminiAnswerError, GeminiError, failureReason } from "@/lib/readListen/generate";
import { aiCooldown } from "@/lib/readListen/cooldown";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** The same answers get the same summary for 30 days (and don't use the AI quota again). */
const CACHE_SECONDS = 30 * 24 * 60 * 60;

// 12 summaries per visitor per hour: enough to try a few variations, not enough to drain the free quota
const rateLimiter = createRateLimiter(12, 60 * 60 * 1000);

/** Thrown instead of calling Google while the AI is paused after a usage limit. */
class AiPausedError extends Error {}

/**
 * Writes the short summary for a project scoping snapshot. The estimate itself is always recalculated
 * here from the answers (the page's numbers are never trusted) and Gemini only rewords it; its answer is
 * rejected if it contains numbers that aren't in the estimate. Without a key, or when the AI is busy,
 * paused or unusable, a template summary is returned with `source: "template"` (and a `reason` code).
 * Returns 400 for invalid answers and 429 when a visitor asks too often.
 */
export async function POST(request: Request) {
  const answers = parseAnswers(await request.json().catch(() => null));
  if (!answers) return Response.json({ error: "Please answer all the questions first." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimiter.isLimited(ip)) return Response.json({ error: "That's a lot of estimates! Please try again in a little while." }, { status: 429 });

  const result = estimate(answers);
  const template = (reason?: string) => Response.json({ summary: templateSummary(answers, result), source: "template", ...(reason ? { reason } : {}) });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return template();

  try {
    const summary = await unstable_cache(
      async () => {
        if (aiCooldown.isPaused()) throw new AiPausedError();
        const data = await askGeminiJson({ apiKey, models: geminiModelsFromEnv(), prompt: buildSummaryPrompt(answers, result), schema: SUMMARY_SCHEMA, maxOutputTokens: 1024 });
        const text = parseSummary(data, result);
        if (!text) throw new GeminiAnswerError("The summary had the wrong length or numbers not in the estimate", "mismatch");
        return text;
      },
      ["scope-summary-v1", encodeAnswers(answers), answers.notes ?? ""],
      { revalidate: CACHE_SECONDS }
    )();
    return Response.json({ summary, source: "ai" });
  } catch (error) {
    if (error instanceof AiPausedError) return template("ai-paused");
    if (error instanceof GeminiError && error.status === 429) {
      aiCooldown.pause(error.retryAfterMs);
      console.warn("[scope] Gemini usage limit reached; using the template summary");
      return template("ai-paused");
    }
    const reason = failureReason(error);
    console.error(`[scope] Using the template summary (reason: ${reason}):`, error);
    return template(reason);
  }
}

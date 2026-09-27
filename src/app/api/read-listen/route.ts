import { unstable_cache } from "next/cache";
import { createRateLimiter } from "@/lib/rateLimit";
import { parseRequest } from "@/lib/readListen/options";
import { libraryText } from "@/lib/readListen/library";
import { DEFAULT_GEMINI_MODEL, GeminiError, generateText } from "@/lib/readListen/generate";
import { aiCooldown } from "@/lib/readListen/cooldown";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Generated texts are kept for a week and shared by all visitors. */
const CACHE_SECONDS = 7 * 24 * 60 * 60;

/** Thrown instead of calling Google while the AI is paused after a usage limit. */
class AiPausedError extends Error {}

// 30 texts per visitor per hour: plenty for reading, but stops scripts from burning the free quota
const rateLimiter = createRateLimiter(30, 60 * 60 * 1000);

/**
 * Returns a text in two languages for the Read & Listen page. Uses Gemini when `GEMINI_API_KEY` is set,
 * caching each result (per language pair, level, topic and variant) for a week; falls back to the
 * built-in library when there's no key or the AI fails. After Google's usage limit (429) the AI is paused
 * for Google's suggested time (10 minutes by default) and built-in texts are served with a `notice`, so
 * the page can say why. Returns 400 for invalid input and 429 when a visitor asks for too many texts.
 */
export async function POST(request: Request) {
  const req = parseRequest(await request.json().catch(() => null));
  if (!req) return Response.json({ error: "Please choose two different languages, a level and a topic." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimiter.isLimited(ip)) {
    return Response.json({ error: "That's a lot of reading! Please try again in a little while." }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = (notice?: "ai-paused" | "ai-unavailable") =>
    Response.json({ ...libraryText(req.learn, req.know, req.level, req.topic, req.variant), ...(notice ? { notice } : {}) });
  if (!apiKey) return fallback();

  // The same pair in either order makes the same text, so share one cache entry
  const pair = [req.learn, req.know].sort().join("-");
  try {
    const text = await unstable_cache(
      // Only runs on a cache miss, so already-written texts are still served while the AI is paused
      async () => {
        if (aiCooldown.isPaused()) throw new AiPausedError();
        return generateText(req, { apiKey, model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL });
      },
      ["read-listen-v1", pair, req.level, req.topic, String(req.variant)],
      { revalidate: CACHE_SECONDS }
    )();
    return Response.json(text);
  } catch (error) {
    if (error instanceof AiPausedError) return fallback("ai-paused");
    if (error instanceof GeminiError && error.status === 429) {
      // Free usage limit reached: stop asking Google until the suggested wait is over
      aiCooldown.pause(error.retryAfterMs);
      console.warn(`[read-listen] Gemini usage limit reached; using built-in texts for ${Math.round((error.retryAfterMs ?? 600_000) / 1000)}s`);
      return fallback("ai-paused");
    }
    console.error("[read-listen] Falling back to the built-in library:", error);
    return fallback("ai-unavailable");
  }
}

import { DEFAULT_FALLBACK_MODELS, DEFAULT_GEMINI_MODEL, GeminiAnswerError, GeminiError, isTemporaryFailure, retryAfterFrom } from "./readListen/generate";

/**
 * A small, general Gemini helper for features that want one JSON answer (e.g. the scoping summary).
 * Read & Listen keeps its own specialised version in readListen/generate.ts; both share the error types.
 */

/** Main model plus backups from GEMINI_MODEL and GEMINI_FALLBACK_MODELS (comma-separated; empty = none). */
export function geminiModelsFromEnv(): string[] {
  const main = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const env = process.env.GEMINI_FALLBACK_MODELS;
  const backups = env === undefined ? DEFAULT_FALLBACK_MODELS : env.split(",").map((m) => m.trim()).filter(Boolean);
  return [main, ...backups.filter((m) => m !== main)];
}

/**
 * Asks Gemini for a JSON answer matching `schema` and returns it parsed. Tries the next model when one is
 * busy or slow; throws GeminiError on HTTP errors and GeminiAnswerError when the answer is cut off,
 * blocked, empty or not JSON.
 */
export async function askGeminiJson(options: {
  apiKey: string;
  models: string[];
  prompt: string;
  schema: object;
  maxOutputTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<unknown> {
  const { apiKey, models, prompt, schema, maxOutputTokens = 1024, temperature = 0.6, timeoutMs = 12_000 } = options;
  for (let i = 0; ; i++) {
    try {
      return await askOnce(models[i], apiKey, prompt, schema, maxOutputTokens, temperature, timeoutMs);
    } catch (error) {
      if (i >= models.length - 1 || !isTemporaryFailure(error)) throw error;
      console.warn(`[gemini] ${models[i]} is busy or slow; trying ${models[i + 1]}`);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}

/** One request to one model. */
async function askOnce(model: string, apiKey: string, prompt: string, schema: object, maxOutputTokens: number, temperature: number, timeoutMs: number) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens, responseMimeType: "application/json", responseSchema: schema },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(`Gemini responded ${res.status}: ${detail.slice(0, 300)}`, res.status, retryAfterFrom(res.headers, detail));
  }
  const payload = await res.json();
  const candidate = payload?.candidates?.[0];
  const finishReason: string | null = candidate?.finishReason ?? payload?.promptFeedback?.blockReason ?? null;
  const text: string = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (finishReason === "MAX_TOKENS") throw new GeminiAnswerError("Gemini ran out of output tokens", "max-tokens");
  if (finishReason && /SAFETY|BLOCKLIST|PROHIBITED|RECITATION|SPII/.test(finishReason)) throw new GeminiAnswerError(`Gemini stopped the answer (${finishReason})`, "blocked");
  if (!text.trim()) throw new GeminiAnswerError("Gemini returned an empty answer", "empty");
  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiAnswerError("Gemini returned something that isn't JSON", "bad-json");
  }
}

import { LEVELS, TOPICS, isConversation, languageOf, type LangCode, type Level, type ReadListenRequest, type ReadListenText } from "./options";

/** A failed Gemini request, with the HTTP status and Google's suggested wait when it sends one. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs: number | null = null
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

/**
 * Reads how long Google asks us to wait: the `Retry-After` header (seconds) or the `RetryInfo`
 * detail in the error body (e.g. "41s"). Returns milliseconds, or null if neither is there.
 */
export function retryAfterFrom(headers: Headers | undefined, body: string): number | null {
  const header = Number(headers?.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return header * 1000;
  const match = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return match ? Math.round(Number(match[1]) * 1000) : null;
}

/** Default Gemini model: a free-tier Flash-Lite model (override with GEMINI_MODEL). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

const MAX_SENTENCE_CHARS = 400;

/** How many sentences to ask for at each level: short texts for beginners, a bit more later. */
const SENTENCE_COUNT: Record<Level, number> = { A1: 3, A2: 3, B1: 4, B2: 4, C1: 4, C2: 4 };
/** Dialogue lines per level (even, so both people speak equally). */
const CONVERSATION_LINES: Record<Level, number> = { A1: 4, A2: 4, B1: 6, B2: 6, C1: 6, C2: 6 };

/** Name pairs for conversations, rotated by variation. The names read naturally in all six languages. */
export const SPEAKER_PAIRS: [string, string][] = [
  ["Sara", "Tom"],
  ["Lucas", "Emma"],
  ["Nina", "Marco"],
  ["Leo", "Clara"],
];

/** The two people in a conversation for a given variation. */
export const speakersFor = (variant: number) => SPEAKER_PAIRS[variant % SPEAKER_PAIRS.length];

/** Builds the instructions sent to the model for one text (a paragraph, or a dialogue for conversations). */
export function buildPrompt({ learn, know, level, topic, variant }: Required<ReadListenRequest>): string {
  const lvl = LEVELS.find((l) => l.id === level)!;
  const t = TOPICS.find((x) => x.id === topic)!;
  const count = SENTENCE_COUNT[level];
  if (isConversation(topic)) {
    const [a, b] = speakersFor(variant);
    const lines = CONVERSATION_LINES[level];
    return [
      `Write a short, natural dialogue for language learners: ${t.prompt}, ${a} and ${b}.`,
      `This is variation number ${variant + 1}: pick your own everyday situation so it differs from other variations.`,
      `Level: CEFR ${level} (${lvl.label}), meaning ${lvl.guide}.`,
      `Write exactly ${lines} lines in ${languageOf(learn).english} (field "learn"), alternating speakers: ${a} says the first line, ${b} the second, and so on.`,
      "Each line is what one person says, without their name in front.",
      `Add a faithful line-by-line translation in ${languageOf(know).english} (field "know"), with the same number of lines in the same order.`,
      "Keep it friendly and suitable for all ages. No titles, stage directions, markdown or quotation marks.",
    ].join("\n");
  }
  return [
    `Write a short text for language learners about ${t.prompt}.`,
    `This is variation number ${variant + 1}: invent a character, place and details of your own so it differs from other variations.`,
    `Level: CEFR ${level} (${lvl.label}), meaning ${lvl.guide}.`,
    `Write exactly ${count} sentences in ${languageOf(learn).english} (field "learn"),`,
    `and a faithful sentence-by-sentence translation in ${languageOf(know).english} (field "know"), with the same number of sentences in the same order.`,
    "Keep it natural, friendly and suitable for all ages. No titles, lists, markdown or quotation marks around sentences.",
  ].join("\n");
}

/** JSON schema passed to Gemini so it answers with two arrays of sentences. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    learn: { type: "ARRAY", items: { type: "STRING" } },
    know: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["learn", "know"],
};

/** Cleans one sentence from the model: trims, drops markdown/quote wrappers, collapses whitespace. */
function cleanSentence(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim().replace(/^["“«]\s*|\s*["”»]$/g, "");
  return text && text.length <= MAX_SENTENCE_CHARS ? text : null;
}

/**
 * Checks the model's answer: both arrays present, 2–6 sentences each, same length, no empty or
 * overly long sentences. Returns the cleaned sentences keyed by language, or null if it's unusable.
 */
export function parseAiSentences(data: unknown, learn: LangCode, know: LangCode): Record<string, string[]> | null {
  if (!data || typeof data !== "object") return null;
  const { learn: a, know: b } = data as { learn?: unknown; know?: unknown };
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length < 2 || a.length > 6) return null;
  const left = a.map(cleanSentence);
  const right = b.map(cleanSentence);
  if (left.some((s) => s === null) || right.some((s) => s === null)) return null;
  return { [learn]: left as string[], [know]: right as string[] };
}

/**
 * Asks Gemini for a new text and returns it, or throws if the request fails or the answer can't be used
 * (the caller then falls back to the built-in library).
 * @param options.apiKey - Google AI Studio key (server-side only).
 * @param options.model - Model name; defaults to DEFAULT_GEMINI_MODEL.
 */
export async function generateText(
  req: Required<ReadListenRequest>,
  { apiKey, model = DEFAULT_GEMINI_MODEL }: { apiKey: string; model?: string }
): Promise<ReadListenText> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(req) }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(`Gemini responded ${res.status}: ${detail.slice(0, 300)}`, res.status, retryAfterFrom(res.headers, detail));
  }

  const payload = await res.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned something that isn't JSON");
  }
  const sentences = parseAiSentences(parsed, req.learn, req.know);
  if (!sentences) throw new Error("Gemini's text didn't have matching sentences in both languages");
  return {
    topic: req.topic,
    level: req.level,
    source: "ai",
    sentences,
    ...(isConversation(req.topic) ? { speakers: speakersFor(req.variant) } : {}),
  };
}

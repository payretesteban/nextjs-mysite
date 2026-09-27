/**
 * Languages, levels and topics for the Read & Listen page, plus the shapes shared by the page,
 * the API route and the built-in library.
 */

/** Two-letter code of a supported language. All use the Latin alphabet, so no extra fonts are needed. */
export type LangCode = "es" | "en" | "fr" | "pt" | "it" | "de";

/** A language the page offers. */
export interface Language {
  code: LangCode;
  /** Name in the language itself, shown in the menus. */
  name: string;
  /** English name, used in the AI prompt. */
  english: string;
  /** BCP 47 tag used for the `lang` attribute and to pick a speech voice. */
  tag: string;
}

export const LANGUAGES: Language[] = [
  { code: "es", name: "Español", english: "Spanish", tag: "es-ES" },
  { code: "en", name: "English", english: "English", tag: "en-US" },
  { code: "fr", name: "Français", english: "French", tag: "fr-FR" },
  { code: "pt", name: "Português", english: "Portuguese (Brazil)", tag: "pt-BR" },
  { code: "it", name: "Italiano", english: "Italian", tag: "it-IT" },
  { code: "de", name: "Deutsch", english: "German", tag: "de-DE" },
];

/** CEFR level, from beginner (A1) to near-native (C2). */
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** Levels in order from easiest to hardest, with a short description for the AI prompt and tooltips. */
export const LEVELS: { id: Level; label: string; guide: string }[] = [
  { id: "A1", label: "Beginner", guide: "very short sentences, present tense, the most common everyday words" },
  { id: "A2", label: "Elementary", guide: "short sentences, present and simple past, common everyday vocabulary" },
  { id: "B1", label: "Intermediate", guide: "connected sentences, past and future tenses, some linking words" },
  { id: "B2", label: "Upper intermediate", guide: "longer sentences, varied tenses, opinions and some idioms" },
  { id: "C1", label: "Advanced", guide: "complex sentences, subordinate clauses, precise and less common vocabulary" },
  { id: "C2", label: "Proficient", guide: "sophisticated, nuanced style with idiomatic expressions and rich vocabulary" },
];

/** Topic keys offered as presets (no free text, so the AI can't be asked to write just anything). */
export type TopicId = "market" | "travel" | "cooking" | "work" | "nature" | "city" | "conversation";

/** Preset topics, with the English description used in the AI prompt. */
export const TOPICS: { id: TopicId; label: string; prompt: string }[] = [
  { id: "market", label: "At the market", prompt: "shopping for food at a local market" },
  { id: "travel", label: "Travel", prompt: "a short trip to a new place" },
  { id: "cooking", label: "Cooking", prompt: "cooking a meal at home" },
  { id: "work", label: "Work", prompt: "a day at work in an office or workshop" },
  { id: "nature", label: "Nature", prompt: "a walk in nature" },
  { id: "city", label: "City life", prompt: "everyday life in a big city" },
  { id: "conversation", label: "Conversation", prompt: "an everyday conversation between two friends" },
];

/** True for topics shown as a dialogue between two people instead of a paragraph. */
export const isConversation = (topic: TopicId) => topic === "conversation";

/** One text in every requested language, split into sentences that line up by index. */
export type Sentences = Partial<Record<LangCode, string[]>>;

/** What the page shows: a topic at a level, in two languages, and where it came from. */
export interface ReadListenText {
  topic: TopicId;
  level: Level;
  sentences: Sentences;
  /** For conversations: the two people's names. Lines alternate between them, starting with the first. */
  speakers?: [string, string];
  /** "ai" for a freshly generated text, "library" for a built-in one. */
  source: "ai" | "library";
  /**
   * Why a built-in text was used instead of AI, when that wasn't the plan: "ai-paused" after Google's
   * free usage limit was reached, "ai-unavailable" after another error. Absent otherwise.
   */
  notice?: "ai-paused" | "ai-unavailable";
}

/** Request body for `POST /api/read-listen`. */
export interface ReadListenRequest {
  learn: LangCode;
  know: LangCode;
  level: Level;
  topic: TopicId;
  /** Which variation to fetch (0, 1, 2…); "New text" asks for the next one so texts don't repeat. */
  variant?: number;
}

/** True if `value` is one of the supported language codes. */
export const isLang = (value: unknown): value is LangCode => LANGUAGES.some((l) => l.code === value);
/** True if `value` is one of the CEFR levels. */
export const isLevel = (value: unknown): value is Level => LEVELS.some((l) => l.id === value);
/** True if `value` is one of the preset topics. */
export const isTopic = (value: unknown): value is TopicId => TOPICS.some((t) => t.id === value);

/** Looks up a language by code (always found for a valid `LangCode`). */
export const languageOf = (code: LangCode): Language => LANGUAGES.find((l) => l.code === code)!;

/** The next level up, or null at C2. */
export function nextLevel(level: Level): Level | null {
  const i = LEVELS.findIndex((l) => l.id === level);
  return LEVELS[i + 1]?.id ?? null;
}

/**
 * Checks and cleans a body sent to the API. Returns null if anything is missing or unsupported,
 * or if both languages are the same.
 */
export function parseRequest(body: unknown): Required<ReadListenRequest> | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!isLang(b.learn) || !isLang(b.know) || b.learn === b.know || !isLevel(b.level) || !isTopic(b.topic)) return null;
  const variant = Number.isInteger(b.variant) ? Math.min(Math.max(b.variant as number, 0), 99) : 0;
  return { learn: b.learn, know: b.know, level: b.level, topic: b.topic, variant };
}

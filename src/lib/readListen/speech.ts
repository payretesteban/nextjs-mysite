/**
 * Joke and effect voices that ship with macOS (and show up in Chrome and Safari). They're fun, but
 * useless for learning and some of them fail or cut out mid-sentence, so they're never chosen.
 */
const NOVELTY_VOICES =
  /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ)\b/i;

/** True for joke/effect voices that should never be used. */
export const isNoveltyVoice = (voice: SpeechSynthesisVoice) => NOVELTY_VOICES.test(voice.name);

/**
 * Character voices that newer macOS versions add in every language ("Eddy (French (France))",
 * "Grandma (German (Germany))"…). They're listed as installed but often load slowly the first time,
 * so they're only used when nothing better exists.
 */
const CHARACTER_VOICES = /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley)\b|\(.+\(.+\)\)$/i;

/** Well-known standard voices per platform (macOS, Windows, Android), which start quickly. */
const STANDARD_VOICES =
  /^(samantha|alex|allison|ava|tom|daniel|karen|moira|m[oó]nica|paulina|jorge|thomas|am[eé]lie|marie|anna|helena|martin|yannick|alice|luca|federica|luciana|joana|microsoft |google )/i;

/**
 * How suitable a voice is: installed on the device first (starts faster, works offline), then a
 * standard voice, then anything but a character voice.
 */
function voiceScore(v: SpeechSynthesisVoice): number {
  return (v.localService ? 4 : 0) + (STANDARD_VOICES.test(v.name) && !CHARACTER_VOICES.test(v.name) ? 2 : 0) + (CHARACTER_VOICES.test(v.name) ? 0 : 1);
}

/**
 * Picks the best built-in browser voice for a language: an exact match for the tag (e.g. "es-ES")
 * first, then any voice for the same language (e.g. "es-MX"). Among those, installed standard voices
 * come first and slow-to-load character voices last (see `voiceScore`). Returns null if there's none.
 */
export function pickVoice(voices: SpeechSynthesisVoice[], tag: string): SpeechSynthesisVoice | null {
  const norm = (lang: string) => lang.replace("_", "-").toLowerCase();
  const want = norm(tag);
  const base = want.split("-")[0];
  const usable = voices.filter((v) => !isNoveltyVoice(v));
  const exact = usable.filter((v) => norm(v.lang) === want);
  const sameLanguage = usable.filter((v) => norm(v.lang).split("-")[0] === base);
  const candidates = exact.length ? exact : sameLanguage;
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

/**
 * Picks a second, different voice for the same language (for the other person in a conversation).
 * It must be the same kind as the first (both installed, or both online): mixing the two in one
 * reading is where browsers like Chrome tend to stop partway. Returns null when there's no such
 * voice, and the caller changes the pitch instead.
 */
export function pickOtherVoice(voices: SpeechSynthesisVoice[], tag: string, first: SpeechSynthesisVoice | null): SpeechSynthesisVoice | null {
  if (!first) return null;
  const others = voices.filter((v) => v !== first && v.name !== first.name && v.localService === first.localService);
  return pickVoice(others, tag);
}

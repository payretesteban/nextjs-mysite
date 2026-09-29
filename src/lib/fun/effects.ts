/**
 * Fun mode effects: what exists, how long each plays, and the helpers that pick the next one and spot
 * the secret Konami code. The effects themselves are drawn by `FunOverlay` (canvas) and CSS in
 * globals.css (keyed on `<html data-fun="…">`).
 */

/** Effects in the random rotation. */
export type RegularEffectId = "confetti" | "scuba" | "skydive" | "retro" | "wave" | "party";
/** Every effect, including the secret one. */
export type EffectId = RegularEffectId | "deepdrop";

/** One fun mode effect. */
export interface Effect {
  id: EffectId;
  name: string;
  emoji: string;
  /** How long it plays, in seconds. */
  seconds: number;
  /** True when it draws on the canvas overlay (the overlay's code only loads for these). */
  overlay: boolean;
}

export const EFFECTS: Record<EffectId, Effect> = {
  confetti: { id: "confetti", name: "Confetti", emoji: "🎉", seconds: 6, overlay: true },
  scuba: { id: "scuba", name: "Scuba", emoji: "🫧", seconds: 8, overlay: true },
  skydive: { id: "skydive", name: "Skydive", emoji: "🪂", seconds: 6, overlay: true },
  retro: { id: "retro", name: "Retro", emoji: "📺", seconds: 9, overlay: false },
  wave: { id: "wave", name: "Wave", emoji: "🌊", seconds: 8, overlay: false },
  party: { id: "party", name: "Party", emoji: "🌈", seconds: 8, overlay: false },
  // Secret (Konami code only): skydive in, then sink underwater with bubbles
  deepdrop: { id: "deepdrop", name: "Deep Drop mode", emoji: "🤿", seconds: 14, overlay: true },
};

/** The effects "Some fun" picks from, in a fixed order (shuffled when played). */
export const ROTATION: RegularEffectId[] = ["confetti", "scuba", "skydive", "retro", "wave", "party"];

/** Returns a shuffled copy (Fisher–Yates, so every order is equally likely). */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A new shuffled round of every effect, never starting with the one that just played (so the same
 * effect doesn't show twice in a row across rounds).
 */
export function newRound(last: EffectId | null, random: () => number = Math.random): RegularEffectId[] {
  const round = shuffle(ROTATION, random);
  if (round.length > 1 && round[0] === last) [round[0], round[1]] = [round[1], round[0]];
  return round;
}

/** The secret code (Konami style, ending in my initials), as KeyboardEvent keys: ↑ ↑ ↓ ↓ ← → ← → E P. */
export const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "e", "p"];

/**
 * Adds a key to the typed-so-far buffer and says whether the Konami code is now complete. Letters are
 * matched case-insensitively; the buffer keeps only the last few keys.
 */
export function pushKey(buffer: string[], key: string): { buffer: string[]; unlocked: boolean } {
  const k = key.length === 1 ? key.toLowerCase() : key;
  const next = [...buffer, k].slice(-KONAMI.length);
  return { buffer: next, unlocked: next.length === KONAMI.length && next.every((x, i) => x === KONAMI[i]) };
}

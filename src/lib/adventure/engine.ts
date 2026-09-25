/**
 * Tiny text-adventure engine: parses a command, runs the matching action for the current stage,
 * and returns the new state plus the lines to print. Pure functions — easy to test.
 */
import { STAGES } from "./story";
import type { Ctx, Line, Stage, StageId } from "./types";

/** Everything about a game in progress. Plain data, so each step returns a new copy. */
export interface GameState {
  stage: StageId;
  /** Things done so far; "#" counters can appear more than once. */
  flags: string[];
  score: number;
  moves: number;
  retries: number;
  /** How many hints were asked for (not scored). */
  hints: number;
  status: "playing" | "dead" | "won";
  /** Snapshot taken when entering a stage, restored by RETRY. */
  checkpoint: { flags: string[]; score: number };
}

/** What `step` returns: the next state, the lines to print and an optional UI event. */
export interface StepResult {
  state: GameState;
  lines: Line[];
  /** Side effects for the UI: open the contact form, or celebrate a win. */
  event?: "contact" | "win";
}

/** Shown in the terminal header. */
export const GAME_TITLE = "The Deep Drop";

const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, Stage>;
/** Points taken off the final score for each retry after dying. */
const RETRY_PENALTY = 5;

/** Lowercase, strip punctuation and filler words, collapse spaces. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(?:the|a|an|my|your|some|please|now|then)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Wraps a flag list in the `Ctx` helpers that stage texts and actions use. */
function ctxOf(flags: string[]): Ctx {
  return {
    has: (f) => flags.includes(f),
    count: (f) => flags.filter((x) => x === f).length,
  };
}

/** The stage title and intro, printed on entering a stage and by LOOK. */
function describe(state: GameState): Line[] {
  const stage = STAGE_BY_ID[state.stage];
  return [
    { kind: "title", text: stage.title },
    { kind: "text", text: stage.intro(ctxOf(state.flags)) },
  ];
}

/** A fresh game at the first stage, with no flags and no score. */
export function initialState(): GameState {
  return { stage: "plane", flags: [], score: 0, moves: 0, retries: 0, hints: 0, status: "playing", checkpoint: { flags: [], score: 0 } };
}

/** Starts a new game: the initial state plus the welcome line and the first stage's description. */
export function start(): { state: GameState; lines: Line[] } {
  const state = initialState();
  return {
    state,
    lines: [
      { kind: "system", text: "A tiny text adventure. Type what you want to do (for example: jump), or tap a suggestion. Type HELP any time." },
      ...describe(state),
    ],
  };
}

/** The status bar readout for the current stage (altitude, or depth and air). */
export function statusFor(state: GameState): string {
  return STAGE_BY_ID[state.stage].status(ctxOf(state.flags));
}

/** The current stage's title. */
export function stageTitle(state: GameState): string {
  return STAGE_BY_ID[state.stage].title;
}

/** Commands to offer as buttons; after dying or winning, only RETRY/RESTART make sense. */
export function suggestionsFor(state: GameState): string[] {
  if (state.status === "dead") return ["retry", "restart"];
  if (state.status === "won") return ["restart"];
  return STAGE_BY_ID[state.stage].suggestions(ctxOf(state.flags));
}

/* ------------------------------------------------------------------ */
/* Scoring                                                              */
/* ------------------------------------------------------------------ */

/** The best possible run (every bonus, no retries). Also used by the tests. */
export const WALKTHROUGH = [
  "check handles", "jump", "deploy main", "cut away", "pull reserve", "lower gear bag", "loosen chest strap", "flare",
  "get out of harness", "follow a seam to the edge", "open gear bag",
  "open valve", "put on BCD", "inflate BCD", "put on mask", "regulator in mouth", "check gauge", "put on fins", "descend",
  "turn on lights", "tie off the line", "check gauge", "enter cave", "frog kick",
  "attach lift bag", "inflate lift bag a little", "follow the line out", "send up the lift bag",
  "ascend slowly", "safety stop", "surface", "inflate BCD", "grab the lift bag", "activate GPS",
];

// getMaxScore plays the walkthrough through `step`; computingMax stops that run from printing the win summary
let maxScoreCache: number | null = null;
let computingMax = false;

/**
 * The highest possible score, found by playing the walkthrough once and caching the result.
 * Used to show "score of max" and to pick the rank.
 */
export function getMaxScore(): number {
  if (maxScoreCache !== null) return maxScoreCache;
  computingMax = true;
  let state = initialState();
  for (const cmd of WALKTHROUGH) state = step(state, cmd).state;
  computingMax = false;
  maxScoreCache = state.score;
  return maxScoreCache;
}

/** The score minus the retry penalty, never below zero. */
export function finalScore(state: GameState) {
  return Math.max(0, state.score - state.retries * RETRY_PENALTY);
}

/** A fun rank title based on the final score as a share of the best possible score. */
export function rankFor(state: GameState): string {
  const pct = finalScore(state) / getMaxScore();
  if (state.flags.includes("no_treasure")) return pct >= 0.5 ? "Survivor" : "Lucky Survivor";
  if (pct >= 0.95) return "Cave Legend";
  if (pct >= 0.75) return "Divemaster";
  if (pct >= 0.5) return "Open Water Diver";
  return "Lucky Survivor";
}

/* ------------------------------------------------------------------ */
/* Commands                                                             */
/* ------------------------------------------------------------------ */

/** Text printed by HELP. */
const HELP =
  "Type short commands like JUMP, CUT AWAY, PUT ON MASK or CHECK GAUGE. Each stage has a right way through; one wrong move ends the game, but RETRY takes you back to the start of that stage. Other commands: LOOK (describe again), HINT, INVENTORY, SCORE, RESTART.";

/** Commands that work in every stage, checked before the current stage's own actions. */
const GLOBAL = {
  restart: /^(?:restart|start over|new game|play again|reset)$/,
  retry: /^(?:retry|try again|retry stage)$/,
  help: /^(?:help|h|instructions|commands|how to play)$/,
  hint: /^(?:hint|clue|tip|what now|what do i do)$/,
  look: /^(?:l|look|look around|where am i|describe)$/,
  inventory: /^(?:i|inv|inventory|gear|what do i have|equipment)$/,
  score: /^(?:score|status|stats)$/,
  contact: /\b(?:hire|hire esteban|contact|work together|lets work together)\b/,
  xyzzy: /^(?:xyzzy|plugh|plover)$/,
  instruments: /^(?:check|look at|read) (?:altimeter|alti|altitude|depth|computer|dive computer|gauge|air|pressure)$/,
};

/**
 * Runs one player command and returns the new state and output. Never changes `prev`.
 * Order matters: always-on commands (restart, help, contact, score) come first, then retry and
 * the dead/won checks, then LOOK/INVENTORY/HINT, and finally the current stage's actions.
 * Flags that are already set aren't added again (except # counters), so repeating an action scores nothing.
 * @param raw - The command exactly as typed; it is echoed back and then normalized.
 */
export function step(prev: GameState, raw: string): StepResult {
  const input = normalize(raw);
  const echo: Line = { kind: "input", text: raw.trim() };
  if (!input && raw.trim() !== "?") return { state: prev, lines: [] };

  const state: GameState = { ...prev, flags: [...prev.flags] };
  const ctx = ctxOf(state.flags);
  const stage = STAGE_BY_ID[state.stage];
  // Every result starts with the echoed command
  const out = (lines: Line[], s: GameState = state, event?: StepResult["event"]): StepResult => ({ state: s, lines: [echo, ...lines], event });

  // Commands that work at any time
  if (GLOBAL.restart.test(input)) {
    const fresh = start();
    return out([{ kind: "system", text: "Starting over." }, ...fresh.lines.slice(1)], fresh.state);
  }
  if (GLOBAL.help.test(input) || raw.trim() === "?") return out([{ kind: "hint", text: HELP }]);
  if (GLOBAL.contact.test(input)) {
    return out([{ kind: "system", text: "Opening the contact form. The adventure will be right here when you're back." }], state, "contact");
  }
  if (GLOBAL.score.test(input)) {
    return out([{ kind: "system", text: `Score ${state.score} · ${state.moves} moves · ${state.retries} retries.` }]);
  }

  if (state.status === "won") {
    return out([{ kind: "system", text: "You already made it! Type RESTART to play again." }]);
  }

  if (GLOBAL.retry.test(input)) {
    // Back to the start of the current stage (counts as a retry only after dying)
    const retried: GameState = {
      ...state,
      flags: [...state.checkpoint.flags],
      score: state.checkpoint.score,
      status: "playing",
      retries: state.retries + (state.status === "dead" ? 1 : 0),
    };
    return out([{ kind: "system", text: "Back to the start of this stage." }, ...describe(retried)], retried);
  }

  if (state.status === "dead") {
    return out([{ kind: "system", text: "You didn't make it this time. Type RETRY to try this stage again, or RESTART to start over." }]);
  }

  if (GLOBAL.look.test(input)) return out(describe(state));
  if (GLOBAL.inventory.test(input)) return out([{ kind: "text", text: `You have: ${stage.inventory(ctx)}` }]);
  if (GLOBAL.hint.test(input)) {
    state.hints += 1;
    return out([{ kind: "hint", text: stage.hint(ctx) }]);
  }
  if (GLOBAL.xyzzy.test(input)) {
    return out([{ kind: "text", text: "A hollow voice says: “Wrong adventure.” Nice try, though." }]);
  }

  // Stage actions
  state.moves += 1;
  const action = stage.actions.find((a) => a.match.test(input));
  if (!action) {
    if (GLOBAL.instruments.test(input)) return out([{ kind: "system", text: statusFor(state) }]);
    return out([{ kind: "system", text: "That doesn't seem to help right now. Type HINT if you're stuck." }]);
  }

  const outcome = action.run(ctx);

  if (outcome.die) {
    state.status = "dead";
    return out([
      { kind: "danger", text: outcome.text },
      ...(outcome.lesson ? [{ kind: "lesson" as const, text: outcome.lesson }] : []),
      { kind: "system", text: "GAME OVER. Type RETRY to try this stage again, or RESTART to start over." },
    ]);
  }

  const newFlags = (outcome.set ?? []).filter((f) => f.startsWith("#") || !state.flags.includes(f));
  if (outcome.set && outcome.set.length && !newFlags.length && !outcome.goto && !outcome.win) {
    return out([{ kind: "system", text: "You've already done that." }]);
  }
  state.flags.push(...newFlags);
  const earned = outcome.points ?? 0;
  state.score += earned;

  const lines: Line[] = [{ kind: earned ? "success" : "text", text: outcome.text }];

  if (outcome.win) {
    state.status = "won";
    if (!computingMax) {
      lines.push(
        { kind: "title", text: "You made it!" },
        {
          kind: "system",
          text: `Final score ${finalScore(state)} of ${getMaxScore()}${state.retries ? ` (−${RETRY_PENALTY} per retry)` : ""} · Rank: ${rankFor(state)} · ${state.moves} moves · ${state.retries} ${state.retries === 1 ? "retry" : "retries"}`,
        },
        { kind: "hint", text: "Type RESTART to play again. Psst: type HIRE if you'd like to work together." }
      );
    }
    return out(lines, state, "win");
  }

  if (outcome.goto) {
    state.stage = outcome.goto;
    state.checkpoint = { flags: [...state.flags], score: state.score };
    lines.push(...describe(state));
  }
  return out(lines);
}

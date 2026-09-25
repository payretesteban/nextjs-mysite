/** The game's stages, in the order they are played. */
export type StageId =
  | "plane"
  | "freefall"
  | "malfunction"
  | "canopy"
  | "water"
  | "gearup"
  | "entrance"
  | "cave"
  | "chamber"
  | "exit"
  | "ascent"
  | "surface";

/** Kind of an output line; the terminal styles each kind differently. */
export type LineKind = "input" | "title" | "text" | "success" | "danger" | "lesson" | "hint" | "system";

/** One line of game output. */
export interface Line {
  kind: LineKind;
  text: string;
}

/** Read-only view of the game flags, passed to stage texts and actions. */
export interface Ctx {
  /** True when a flag has been set during this game. */
  has: (flag: string) => boolean;
  /** How many times a repeatable "#counter" flag has been set. */
  count: (flag: string) => number;
}

/** What happens after a command. Flags starting with "#" are counters and can repeat. */
export interface Outcome {
  text: string;
  /** Points added to the score. */
  points?: number;
  /** Flags to set, e.g. "handles" or a "#counter". */
  set?: string[];
  /** Move to this stage (and save a checkpoint there). */
  goto?: StageId;
  /** The player dies; `lesson` explains the right move. */
  die?: boolean;
  lesson?: string;
  /** The game ends with a win. */
  win?: boolean;
}

/** A command the player can type in a stage, and what it does. */
export interface Action {
  /** Tested against the normalized command (lowercase, no punctuation or articles). */
  match: RegExp;
  run: (ctx: Ctx) => Outcome;
}

/** One stage of the adventure. The functions get the current flags, so texts can change as you play. */
export interface Stage {
  id: StageId;
  title: string;
  /** Description printed on entering the stage (and by LOOK). */
  intro: (ctx: Ctx) => string;
  /** Compact readout for the status bar, e.g. altitude or depth and air. */
  status: (ctx: Ctx) => string;
  hint: (ctx: Ctx) => string;
  /** Commands offered as buttons. */
  suggestions: (ctx: Ctx) => string[];
  /** Text printed by INVENTORY. */
  inventory: (ctx: Ctx) => string;
  actions: Action[];
}

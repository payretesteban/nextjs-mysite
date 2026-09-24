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

export type LineKind = "input" | "title" | "text" | "success" | "danger" | "lesson" | "hint" | "system";

export interface Line {
  kind: LineKind;
  text: string;
}

export interface Ctx {
  /** True when a flag has been set during this game. */
  has: (flag: string) => boolean;
  /** How many times a repeatable "#counter" flag has been set. */
  count: (flag: string) => number;
}

/** What happens after a command. Flags starting with "#" are counters and can repeat. */
export interface Outcome {
  text: string;
  points?: number;
  set?: string[];
  goto?: StageId;
  /** The player dies; `lesson` explains the right move. */
  die?: boolean;
  lesson?: string;
  win?: boolean;
}

export interface Action {
  /** Tested against the normalized command (lowercase, no punctuation or articles). */
  match: RegExp;
  run: (ctx: Ctx) => Outcome;
}

export interface Stage {
  id: StageId;
  title: string;
  intro: (ctx: Ctx) => string;
  status: (ctx: Ctx) => string;
  hint: (ctx: Ctx) => string;
  suggestions: (ctx: Ctx) => string[];
  inventory: (ctx: Ctx) => string;
  actions: Action[];
}

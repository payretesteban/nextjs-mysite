/**
 * Site themes: change the site's look (colours, fonts, small decorations) without changing its layout.
 * The colours themselves live in `src/app/themes.css`; this file lists the themes, decides which are
 * available today (seasonal ones only in their season) and builds the tiny script that applies the
 * visitor's choice before the page paints.
 *
 * To add a theme: add it to THEMES (and THEME_IDS), give it a colour block in themes.css, and optionally
 * a decoration in ThemeDecorations.tsx.
 */

export const THEME_IDS = ["circuit", "clean", "contrast", "retro", "halloween"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** What first-time visitors see (also rendered by the server, so the page looks right without JavaScript). */
export const DEFAULT_THEME: ThemeId = "circuit";
/**
 * The theme that needs no `data-theme` attribute: the site's base styles, light or dark. Every other
 * theme is a `data-theme` value on <html>.
 */
export const BASE_THEME: ThemeId = "clean";

/** Light/dark preference; only applies to the Clean theme (the others have their own colours). */
export const MODES = ["system", "light", "dark"] as const;
export type Mode = (typeof MODES)[number];

/** A month and day, e.g. [10, 15] for October 15. */
type MonthDay = [month: number, day: number];

export interface Theme {
  id: ThemeId;
  name: string;
  /** One line shown in the picker. */
  description: string;
  /** Background, text and accent colours for the picker's mini preview. */
  swatches: [background: string, text: string, accent: string];
  /** Seasonal themes are only offered between these dates (inclusive), every year. */
  season?: {
    /** In the picker from this day… */
    from: MonthDay;
    /** …until this day (inclusive), every year. */
    to: MonthDay;
    /** The corner invitation shows from this day until `to`. */
    inviteFrom: MonthDay;
    emoji: string;
    invite: string;
  };
  /** True when the theme looks dark (used e.g. for the booking popup's colours). */
  dark: boolean;
}

export const THEMES: Theme[] = [
  { id: "circuit", name: "Circuit", description: "Ink navy, sky and teal, like my business card", swatches: ["#161720", "#f4f5f7", "#5ac7bc"], dark: true },
  { id: "clean", name: "Clean", description: "Simple and calm, light or dark", swatches: ["#ffffff", "#0f172a", "#0ea5e9"], dark: false },
  { id: "contrast", name: "High contrast", description: "Black and white with yellow accents", swatches: ["#000000", "#ffffff", "#ffff00"], dark: true },
  { id: "retro", name: "Retro CRT", description: "Green phosphor terminal, like The Deep Drop", swatches: ["#03170c", "#4ade80", "#bbf7d0"], dark: true },
  {
    id: "halloween",
    name: "Halloween",
    description: "Pumpkin orange, midnight purple and a few bats",
    swatches: ["#150b1e", "#f3ecf9", "#fb923c"],
    dark: true,
    season: { from: [10, 1], to: [11, 1], inviteFrom: [10, 15], emoji: "🎃", invite: "It's spooky season. Try the Halloween theme?" },
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

/** Browser storage keys. */
export const STORAGE = { theme: "ep-theme", mode: "ep-mode", nudge: "ep-theme-nudge", tip: "ep-theme-tip" } as const;

/** The theme with this id (the default theme for anything unknown). */
export function getTheme(id: string | null | undefined): Theme {
  return BY_ID.get(id as ThemeId) ?? BY_ID.get(DEFAULT_THEME)!;
}

/** True for a known theme id. */
export const isThemeId = (value: unknown): value is ThemeId => typeof value === "string" && BY_ID.has(value as ThemeId);
/** True for a known mode. */
export const isMode = (value: unknown): value is Mode => typeof value === "string" && (MODES as readonly string[]).includes(value);

/** Month and day as a sortable number, e.g. October 15 → 1015. */
const key = ([month, day]: MonthDay) => month * 100 + day;

/** True when a date falls between two month-days (inclusive); ranges can wrap around New Year. */
function between(date: Date, start: MonthDay, end: MonthDay): boolean {
  const today = key([date.getMonth() + 1, date.getDate()]);
  const from = key(start);
  const to = key(end);
  return from <= to ? today >= from && today <= to : today >= from || today <= to;
}

/** True when a theme can be picked on this date (always, unless it's seasonal and out of season). */
export function inSeason(theme: Theme, date: Date): boolean {
  return !theme.season || between(date, theme.season.from, theme.season.to);
}

/** The themes the picker offers on this date. */
export function availableThemes(date: Date): Theme[] {
  return THEMES.filter((t) => inSeason(t, date));
}

/** The seasonal theme to invite visitors to on this date, if any (its invitation window can start later). */
export function currentSeason(date: Date): Theme | null {
  return THEMES.find((t) => t.season && between(date, t.season.inviteFrom, t.season.to)) ?? null;
}

/**
 * The light/dark attribute for the page: themes other than Clean are built on the dark styles (they
 * re-tint them, see themes.css); Clean follows the visitor's mode (no attribute = follow the device).
 */
export function modeAttribute(theme: ThemeId, mode: Mode): "light" | "dark" | null {
  if (theme !== BASE_THEME) return "dark";
  return mode === "system" ? null : mode;
}

/**
 * The script that runs in <head> before anything is drawn: reads the saved theme and mode (or a
 * `?theme=` link, handy for previewing a seasonal theme out of season) and sets `data-theme` and
 * `data-mode` on <html>, so there's no flash of the wrong colours. The server already renders the
 * default theme's attributes; this corrects them for returning visitors. Kept tiny and self-contained.
 */
export function themeInitScript(): string {
  const seasons = Object.fromEntries(THEMES.filter((t) => t.season).map((t) => [t.id, [key(t.season!.from), key(t.season!.to)]]));
  const config = { ids: THEME_IDS, modes: MODES, seasons, keys: STORAGE, fallback: DEFAULT_THEME, base: BASE_THEME };
  return `(function(){try{var c=${JSON.stringify(config)},d=document.documentElement,ls=window.localStorage,now=new Date(),k=(now.getMonth()+1)*100+now.getDate();
var p=new URLSearchParams(location.search).get("theme"),t=ls.getItem(c.keys.theme),m=ls.getItem(c.keys.mode);if(t==="default"||t==="minimalist")t=c.base;
if(p&&c.ids.indexOf(p)>=0){t=p;ls.setItem(c.keys.theme,p);}else{var s=c.seasons[t];if(s&&!(s[0]<=s[1]?k>=s[0]&&k<=s[1]:k>=s[0]||k<=s[1]))t=null;}
if(c.ids.indexOf(t)<0)t=c.fallback;if(c.modes.indexOf(m)<0)m="system";
if(t===c.base)d.removeAttribute("data-theme");else d.setAttribute("data-theme",t);var a=t!==c.base?"dark":(m==="system"?null:m);if(a)d.setAttribute("data-mode",a);else d.removeAttribute("data-mode");}catch(e){}})();`;
}

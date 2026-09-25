/**
 * Every measurement in the game is shown in metric and imperial.
 * Rounded the way divers and skydivers talk: depths to 5 ft, altitudes to 100 ft, pressure to 10 psi.
 */

const FT_PER_M = 3.28084;
const PSI_PER_BAR = 14.5038;
const LB_PER_KG = 2.20462;
const MPH_PER_KMH = 0.621371;

/** Formats a number with thousands separators, e.g. 13100 → "13,100". */
const fmt = (n: number) => n.toLocaleString("en-US");
/** Rounds to the nearest multiple of `step`. */
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Meters to feet, rounded to 5 ft (for depths). */
export const toFt = (m: number) => roundTo(m * FT_PER_M, 5);
/** Meters to feet, rounded to 100 ft (for altitudes). */
export const toFtAltitude = (m: number) => roundTo(m * FT_PER_M, 100);
/** Bar to psi, rounded to 10 psi (for tank pressure). */
export const toPsi = (b: number) => roundTo(b * PSI_PER_BAR, 10);

/** Depths and short distances: "18 m (60 ft)" */
export const depth = (m: number) => `${fmt(m)} m (${fmt(toFt(m))} ft)`;
/** Altitudes: "4,000 m (13,100 ft)" */
export const alt = (m: number) => `${fmt(m)} m (${fmt(toFtAltitude(m))} ft)`;
/** Tank pressure: "190 bar (2,760 psi)" */
export const bar = (b: number) => `${fmt(b)} bar (${fmt(toPsi(b))} psi)`;
/** Weight: "20 kg (44 lb)" */
export const kg = (k: number) => `${fmt(k)} kg (${fmt(Math.round(k * LB_PER_KG))} lb)`;
/** Speed: "200 km/h (125 mph)" */
export const kmh = (k: number) => `${fmt(k)} km/h (${fmt(roundTo(k * MPH_PER_KMH, 5))} mph)`;
/** Ascent rate: "9 m (30 ft) per minute" */
export const rate = (m: number) => `${fmt(m)} m (${fmt(toFt(m))} ft) per minute`;

/* Compact versions for the status bar */

/** Status bar altitude, e.g. "ALT 4,000 m · 13,100 ft". */
export const statusAlt = (m: number) => `ALT ${fmt(m)} m · ${fmt(toFtAltitude(m))} ft`;
/**
 * Status bar while diving: depth and remaining air.
 * @param d - Depth in meters.
 * @param b - Tank pressure in bar.
 */
export const statusDive = (d: number, b: number) =>
  `DEPTH ${fmt(d)} m · ${fmt(toFt(d))} ft | AIR ${fmt(b)} bar · ${fmt(toPsi(b))} psi`;
/** Status bar at the surface; pass the tank pressure in bar to show the air left too. */
export const statusSurface = (b?: number) =>
  b == null ? "SURFACE" : `SURFACE | AIR ${fmt(b)} bar · ${fmt(toPsi(b))} psi`;

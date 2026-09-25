/** Sticky-note paper colors and tilts, shared by the homepage pile and the /site-log page. */
export const PAPER = [
  { bg: "bg-yellow-200", ink: "text-yellow-800" },
  { bg: "bg-sky-200", ink: "text-sky-800" },
  { bg: "bg-pink-200", ink: "text-pink-800" },
  { bg: "bg-lime-200", ink: "text-lime-800" },
];
/** Rotation in degrees for each note, cycled like PAPER so neighbours lean different ways. */
export const TILT = [-2, 2.5, -3.5, 1.5];

/** Pads a note number to two digits, e.g. 3 → "03". */
export const pad = (n: number) => String(n).padStart(2, "0");

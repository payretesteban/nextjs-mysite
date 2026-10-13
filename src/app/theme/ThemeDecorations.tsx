"use client";

import { useTheme } from "./useTheme";

/** Where each bat flies: start height, width, flight time, delay and wingbeat speed (seconds). */
const BATS = [
  { top: "14%", size: 64, duration: 18, delay: 0, flap: 0.32 },
  { top: "38%", size: 46, duration: 24, delay: 6, flap: 0.26 },
  { top: "66%", size: 54, duration: 21, delay: 13, flap: 0.3 },
];

/** A bat whose wings flap (each wing rotates at the shoulder, see `.theme-bat-wing` in themes.css). */
function Bat({ size, flap }: { size: number; flap: number }) {
  const wing = { animationDuration: `${flap}s` };
  return (
    <svg viewBox="0 0 64 32" width={size} height={size / 2} className="block overflow-visible">
      <g className="theme-bat-wing theme-bat-wing-left" style={wing}>
        <path d="M30 14 C24 4 14 2 2 8 C8 10 10 14 8 18 C12 15 16 16 18 20 C20 16 24 16 26 19 C27 17 29 16 30 17 Z" fill="#6b4790" />
      </g>
      <g className="theme-bat-wing theme-bat-wing-right" style={wing}>
        <path d="M34 14 C40 4 50 2 62 8 C56 10 54 14 56 18 C52 15 48 16 46 20 C44 16 40 16 38 19 C37 17 35 16 34 17 Z" fill="#6b4790" />
      </g>
      {/* Body, head with pointy ears, glowing eyes */}
      <ellipse cx="32" cy="17" rx="4.5" ry="7" fill="#563775" />
      <path d="M28.5 10 L28 5.5 L30.5 8.5 L33.5 8.5 L36 5.5 L35.5 10 Z" fill="#563775" />
      <circle cx="30.4" cy="11.2" r="1" fill="#fb923c" />
      <circle cx="33.6" cy="11.2" r="1" fill="#fb923c" />
    </svg>
  );
}

/** A carved pumpkin with a candle flickering inside (`.theme-pumpkin-glow`). */
function Pumpkin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 60" width={size} height={(size * 60) / 64} className="block overflow-visible">
      <path d="M31 12 C30 6 32 3 36 1 C37 3 35 6 35 12 Z" fill="#3f6212" />
      <ellipse cx="18" cy="36" rx="15" ry="20" fill="#c2410c" />
      <ellipse cx="46" cy="36" rx="15" ry="20" fill="#c2410c" />
      <ellipse cx="32" cy="36" rx="17" ry="22" fill="#ea580c" />
      <path d="M32 14 C26 24 26 48 32 58 M22 16 C14 26 14 46 22 56 M42 16 C50 26 50 46 42 56" stroke="#9a3412" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Carved face, lit from inside */}
      <g className="theme-pumpkin-glow" fill="#fde047">
        <path d="M18 30 L25 30 L21.5 23 Z" />
        <path d="M39 30 L46 30 L42.5 23 Z" />
        <path d="M30 33 L34 33 L32 37 Z" />
        <path d="M15 41 C22 50 42 50 49 41 L45 42 L43 46 L40 43 L36 47 L32 43 L28 47 L24 43 L21 46 L19 42 Z" />
      </g>
    </svg>
  );
}

/** A small skeleton hanging from a thread (it sways; see `.theme-skeleton`). */
function Skeleton({ height }: { height: number }) {
  const bone = "#e7dff0";
  return (
    <svg
      viewBox="0 0 40 120"
      width={(height * 40) / 120}
      height={height}
      className="block overflow-visible"
      fill="none"
      stroke={bone}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="20" y1="0" x2="20" y2="22" stroke="#9a7bb8" strokeWidth="0.8" />
      {/* Skull */}
      <path d="M12 30 C12 22 28 22 28 30 C28 35 26 36 25 38 L15 38 C14 36 12 35 12 30 Z" fill={bone} stroke="none" />
      <circle cx="16.5" cy="30" r="2.4" fill="#150b1e" stroke="none" />
      <circle cx="23.5" cy="30" r="2.4" fill="#150b1e" stroke="none" />
      <path d="M19 34 L20 32.5 L21 34" stroke="#150b1e" strokeWidth="1" />
      <path d="M16 38 L16 40 M18.7 38 L18.7 40 M21.3 38 L21.3 40 M24 38 L24 40" strokeWidth="1" />
      {/* Spine and ribs */}
      <line x1="20" y1="41" x2="20" y2="74" strokeWidth="2" />
      <path d="M13 47 C16 45 24 45 27 47 M12.5 52 C16 50 24 50 27.5 52 M13 57 C16 55 24 55 27 57 M14 62 C17 60.5 23 60.5 26 62" strokeWidth="1.6" />
      {/* Pelvis, arms, legs */}
      <path d="M14 74 C16 79 24 79 26 74 Z" fill={bone} stroke="none" />
      <path d="M12 46 L6 60 L8 74 M28 46 L34 60 L32 74" strokeWidth="1.8" />
      <path d="M16 78 L14 98 L15 116 M24 78 L26 98 L25 116" strokeWidth="2" />
      <path d="M12 116 L16 116 M24 116 L28 116" strokeWidth="2" />
    </svg>
  );
}

/**
 * Small extras for themes that have them, drawn above the page but ignoring the mouse and hidden from
 * screen readers. Halloween: bats flapping across the screen, a skeleton hanging in the top corner and
 * jack-o'-lanterns flickering in the bottom corners (corner pieces only on wide screens, so they never
 * cover the text); section headings get a tiny pumpkin too (themes.css). Everything holds still for
 * visitors who prefer reduced motion.
 */
export default function ThemeDecorations() {
  const { theme } = useTheme();
  if (theme !== "halloween") return null;
  return (
    <div aria-hidden="true" data-testid="theme-decorations" className="pointer-events-none fixed inset-0 z-[55] overflow-hidden print:hidden">
      {BATS.map((bat, i) => (
        <span key={i} className="theme-bat" style={{ top: bat.top, animationDuration: `${bat.duration}s`, animationDelay: `${bat.delay}s` }}>
          <Bat size={bat.size} flap={bat.flap} />
        </span>
      ))}
      <span className="theme-skeleton absolute top-16 right-[3%] hidden lg:block">
        <Skeleton height={150} />
      </span>
      <span className="theme-pumpkin absolute bottom-3 left-[2%] hidden lg:block">
        <Pumpkin size={72} />
      </span>
      <span className="theme-pumpkin absolute right-[2.5%] bottom-3 hidden lg:block">
        <Pumpkin size={48} />
      </span>
    </div>
  );
}

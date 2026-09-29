"use client";

import { useEffect, useRef } from "react";
import type { EffectId } from "@/lib/fun/effects";

/** One moving thing on the canvas: a confetti piece or a bubble. */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  angle: number;
  spin: number;
  /** Seconds since it appeared. */
  age: number;
  /** For bubbles: phase of the side-to-side wobble. */
  wobble: number;
}

const CONFETTI_COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6", "#ec4899"];

/** A random number between min and max. */
const between = (min: number, max: number) => min + Math.random() * (max - min);

/** Where confetti comes from: the middle of the header logo, or the top-left corner if it isn't found. */
function logoPoint(): { x: number; y: number } {
  const logo = document.querySelector("header a");
  const r = logo?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 60, y: 30 };
}

/** How the header logo looks, so Deep Drop can drop a copy of it: its text parts, font and colours. */
interface LogoLook {
  initials: string;
  font: string;
  tile: string;
  text: string;
  bracket: string;
}

/** Reads the header logo (the `<EP/>` tile) so the falling copy matches it, in light or dark mode. */
function readLogo(): LogoLook {
  const tile = document.querySelector<HTMLElement>("header a > span");
  const parts = tile ? [...tile.children] as HTMLElement[] : [];
  const style = tile ? getComputedStyle(tile) : null;
  return {
    initials: parts[1]?.textContent?.trim() || "EP",
    font: style?.fontFamily || "ui-monospace, monospace",
    tile: style?.backgroundColor || "#0f172a",
    text: style?.color || "#ffffff",
    bracket: parts[0] ? getComputedStyle(parts[0]).color : "#38bdf8",
  };
}

/** Draws the logo tile centred on (0, 0), `scale` times the header size. */
function drawLogo(ctx: CanvasRenderingContext2D, logo: LogoLook, scale: number) {
  ctx.font = `bold ${12 * scale}px ${logo.font}`;
  const pieces = [
    { text: "<", color: logo.bracket },
    { text: logo.initials, color: logo.text },
    { text: "/>", color: logo.bracket },
  ];
  const widths = pieces.map((p) => ctx.measureText(p.text).width);
  const textWidth = widths.reduce((a, b) => a + b, 0);
  const w = textWidth + 16 * scale;
  const h = 32 * scale;
  ctx.fillStyle = logo.tile;
  ctx.shadowColor = "rgba(15, 23, 42, 0.35)";
  ctx.shadowBlur = 8 * scale;
  ctx.shadowOffsetY = 2 * scale;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 8 * scale);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  let x = -textWidth / 2;
  pieces.forEach((p, i) => {
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, x, 0);
    x += widths[i];
  });
}

/** A new bubble just below the bottom edge. */
function bubble(w: number, h: number, big = false): Particle {
  return { x: between(0, w), y: h + 20, vx: 0, vy: -between(0.6, big ? 2.6 : 2), size: between(3, big ? 20 : 15), color: "", angle: 0, spin: 0, age: 0, wobble: between(0, Math.PI * 2) };
}

/**
 * Draws the canvas part of a fun mode effect over the page (confetti, bubbles, the parachutist, the falling logo) and
 * clears itself when unmounted. Ignores the mouse and is hidden from screen readers. With `calm`
 * (reduced motion) nothing moves: shapes appear, then fade.
 */
export default function FunOverlay({ effect, calm }: { effect: EffectId; calm: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    /** Matches the canvas to the window (sharp on high-density screens). */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const parts: Particle[] = [];
    if (effect === "confetti") {
      const from = logoPoint();
      for (let i = 0; i < 150; i++) {
        parts.push({
          x: calm ? between(0, w) : from.x,
          y: calm ? between(0, h * 0.8) : from.y,
          vx: between(-3, 9),
          vy: between(-11, -2),
          size: between(5, 10),
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          angle: between(0, Math.PI),
          spin: between(-0.25, 0.25),
          age: 0,
          wobble: 0,
        });
      }
    }
    if ((effect === "scuba" || effect === "deepdrop") && calm) {
      for (let i = 0; i < 40; i++) parts.push({ ...bubble(w, h), y: between(h * 0.2, h) });
    }

    const logo = effect === "deepdrop" ? readLogo() : null;

    let last = performance.now();
    let elapsed = 0;
    let frame = 0;

    /** Draws one frame and schedules the next. */
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); // seconds; capped so a paused tab doesn't jump
      last = now;
      elapsed += dt;
      ctx.clearRect(0, 0, w, h);
      const step = dt * 60; // movement below is tuned per 60 fps frame

      if (effect === "confetti") {
        const fade = calm ? Math.max(0, 1 - elapsed / 2.5) : Math.max(0, 1 - Math.max(0, elapsed - 2.5) / 1.2);
        for (const p of parts) {
          if (!calm) {
            p.vy += 0.28 * step;
            p.vx *= 0.99;
            p.x += p.vx * step;
            p.y += p.vy * step;
            p.angle += p.spin * step;
          }
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      const bubbles = effect === "scuba" || (effect === "deepdrop" && elapsed > 5);
      if (bubbles) {
        if (calm) {
          const fade = Math.max(0, 1 - elapsed / 4);
          ctx.globalAlpha = fade;
        } else if (parts.length < (effect === "deepdrop" ? 90 : 60) && Math.random() < 0.5 * step) {
          parts.push(bubble(w, h, effect === "deepdrop"));
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          if (!calm) {
            p.age += dt;
            p.y += p.vy * step;
            p.x += Math.sin(p.age * 2 + p.wobble) * 0.4 * step;
            if (p.y < -30) {
              parts.splice(i, 1);
              continue;
            }
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(186, 230, 253, 0.25)";
          ctx.strokeStyle = "rgba(14, 165, 233, 0.55)";
          ctx.lineWidth = 1.5;
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.22, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Skydive: the parachutist drifts across the page
      if (!calm && effect === "skydive" && elapsed < 5) {
        const t = elapsed / 5;
        ctx.font = "34px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
        ctx.textAlign = "center";
        ctx.save();
        ctx.translate(w * (0.1 + 0.8 * t), h * (0.12 + 0.35 * t) + Math.sin(elapsed * 2) * 10);
        ctx.rotate(Math.sin(elapsed * 2) * 0.12);
        ctx.fillText("🪂", 0, 0);
        ctx.restore();
      }

      // Deep Drop: the site's <EP/> logo tumbles down, splashes into the water and sinks
      if (!calm && logo) {
        const water = h * 0.55;
        if (elapsed < 5) {
          // Falls faster and faster (ease-in), swaying and spinning a little
          const t = elapsed / 5;
          const y = -60 + (water + 60) * t * t;
          ctx.save();
          ctx.translate(w / 2 + Math.sin(elapsed * 1.5) * 40, y);
          ctx.rotate(Math.sin(elapsed * 2.2) * 0.35 + t * 0.6);
          drawLogo(ctx, logo, 2);
          ctx.restore();
        } else if (elapsed < 9) {
          // Splash rings where it hits the water
          const s = elapsed - 5;
          for (const delay of [0, 0.25]) {
            const r = Math.max(0, s - delay) * 160;
            ctx.strokeStyle = `rgba(14, 165, 233, ${Math.max(0, 1 - (s - delay) * 2)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(w / 2, water, r, r * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          // Then it sinks slowly, tilting and fading into the deep, trailing bubbles
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - s / 4);
          ctx.translate(w / 2 + Math.sin(s * 1.2) * 12, water + s * 45);
          ctx.rotate(0.6 + s * 0.15);
          drawLogo(ctx, logo, 2 - s * 0.2);
          ctx.restore();
          ctx.globalAlpha = 1;
          if (Math.random() < 0.3 * step) {
            parts.push({ ...bubble(w, h), x: w / 2 + between(-20, 20), y: water + s * 45 - 20, size: between(3, 7) });
          }
        }
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [effect, calm]);

  return <canvas ref={canvasRef} aria-hidden="true" data-testid="fun-overlay" className="pointer-events-none fixed inset-0 z-[60] h-full w-full print:hidden" />;
}

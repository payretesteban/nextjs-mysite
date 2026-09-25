"use client";

import { useEffect, useRef, useState } from "react";
import { GAME_TITLE, finalScore, stageTitle, start, statusFor, step, suggestionsFor, type GameState } from "@/lib/adventure/engine";
import type { Line, LineKind } from "@/lib/adventure/types";
import { useContact } from "../contact/ContactProvider";
import { useAnimation } from "../context/AnimationContext";

/** Oldest output lines are dropped past this, so a long game doesn't slow the page down. */
const MAX_LINES = 400;

/* Green phosphor palette */
const PHOSPHOR = "#39ff6e";
const GLOW = "0 0 2px #39ff6e, 0 0 10px rgba(57,255,110,0.55)";
const SCANLINES = "repeating-linear-gradient(0deg, rgba(0,0,0,0.26) 0px, rgba(0,0,0,0.26) 1px, transparent 1px, transparent 3px)";

// Monochrome screen: line types are told apart by brightness and a prefix, like on a real terminal
const LINE_STYLES: Record<LineKind, { className: string; prefix?: string }> = {
  input: { className: "text-[#39ff6e] uppercase", prefix: "> " },
  title: { className: "mt-4 text-[#39ff6e] uppercase tracking-wide" },
  text: { className: "text-[#8dffb0]" },
  success: { className: "text-[#39ff6e]" },
  danger: { className: "text-[#c8ffd8]", prefix: "!! " },
  lesson: { className: "text-[#39ff6e]", prefix: "** " },
  hint: { className: "text-[#6dff95]", prefix: "? " },
  system: { className: "text-[#2fbf5c] [text-shadow:0_0_6px_rgba(57,255,110,0.25)]" },
};

/**
 * The text adventure in a retro 80s CRT monitor. Keeps the game state and output, runs commands
 * from the prompt or the suggestion buttons, and supports ↑/↓ command history.
 * Typing HIRE opens the site's contact form; winning plays one of the site's celebration animations.
 */
export default function Adventure() {
  const [game, setGame] = useState<{ state: GameState; lines: Line[] }>(() => start());
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contact = useContact();
  const { getNextAnimation } = useAnimation();

  // Keep the newest output in view
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [game.lines]);

  /** Runs a command through the engine, appends its output and handles UI events. */
  function run(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;
    const result = step(game.state, trimmed);
    setGame({ state: result.state, lines: [...game.lines, ...result.lines].slice(-MAX_LINES) });
    setHistory((h) => [...h, trimmed].slice(-50));
    setHistoryIndex(null);
    if (result.event === "contact") contact?.open();
    if (result.event === "win") getNextAnimation();
  }

  /** Runs the typed command and clears the prompt. */
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(input);
    setInput("");
  }

  // ↑ / ↓ walk through previous commands, like a terminal
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (!history.length) return;
    e.preventDefault();
    const current = historyIndex ?? history.length;
    const next = e.key === "ArrowUp" ? Math.max(0, current - 1) : Math.min(history.length, current + 1);
    setHistoryIndex(next === history.length ? null : next);
    setInput(next === history.length ? "" : history[next]);
  }

  const { state } = game;
  const suggestions = suggestionsFor(state);

  return (
    /* Beige 80s monitor */
    <div
      className="rounded-[1.6rem] p-3 pb-2 sm:rounded-[2.2rem] sm:p-6 sm:pb-3"
      style={{
        background: "linear-gradient(#e2d9c2, #c9bea3)",
        boxShadow: "inset 0 2px 0 #f3ecd9, inset 0 -6px 12px rgba(0,0,0,.15), 0 30px 60px rgba(0,0,0,.6)",
      }}
    >
      {/* CRT screen */}
      <div
        className="relative overflow-hidden rounded-[1.1rem] sm:rounded-[1.4rem]"
        style={{
          background: "radial-gradient(ellipse at center, #06301a 0%, #021208 80%)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,.9), inset 0 0 4px rgba(0,0,0,1)",
          fontFamily: "var(--font-vt323), ui-monospace, monospace",
          color: PHOSPHOR,
          textShadow: GLOW,
        }}
      >
        <div className="relative z-0 px-4 pt-4 pb-3 text-[18px] leading-[1.25] sm:px-6 sm:pt-5 sm:text-[21px]">
          {/* Header */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-dashed border-[#1d7a3e] pb-1">
            <span className="uppercase">{GAME_TITLE}</span>
            <span className="tabular-nums">
              SCORE {finalScore(state)} · MOVES {state.moves}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-dashed border-[#1d7a3e] py-1 text-[#8dffb0]">
            <span className="uppercase">{stageTitle(state)}</span>
            <span className="tabular-nums">{statusFor(state)}</span>
          </div>

          {/* Output */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Game output"
            onClick={() => {
              if (!window.getSelection()?.toString()) inputRef.current?.focus();
            }}
            className="h-[50vh] min-h-72 space-y-2 overflow-y-auto py-3 pr-1 [scrollbar-color:#1d7a3e_transparent] [scrollbar-width:thin]"
          >
            {game.lines.map((line, i) => {
              const style = LINE_STYLES[line.kind];
              return (
                <p key={i} className={style.className}>
                  {style.prefix && <span aria-hidden="true">{style.prefix}</span>}
                  {line.text}
                </p>
              );
            })}
          </div>

          {/* Prompt */}
          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-dashed border-[#1d7a3e] pt-2">
            <span aria-hidden="true">&gt;</span>
            <label htmlFor="adventure-input" className="sr-only">
              Your command
            </label>
            <input
              ref={inputRef}
              id="adventure-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              placeholder={state.status === "dead" ? "RETRY" : "WHAT DO YOU DO?"}
              className="min-w-0 flex-1 bg-transparent uppercase caret-[#39ff6e] outline-none placeholder:text-[#23a14c] placeholder:[text-shadow:none]"
              style={{ textShadow: GLOW }}
            />
            <button type="submit" className="px-1 transition-colors hover:bg-[#39ff6e] hover:text-[#021208] hover:[text-shadow:none]">
              <span aria-hidden="true">[ </span>Enter<span aria-hidden="true"> ]</span>
            </button>
          </form>

          {/* Suggestions */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => run(s)}
                className="uppercase transition-colors hover:bg-[#39ff6e] hover:text-[#021208] hover:[text-shadow:none] focus-visible:bg-[#39ff6e] focus-visible:text-[#021208] focus-visible:outline-none"
              >
                <span aria-hidden="true">[ </span>
                {s}
                <span aria-hidden="true"> ]</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scanlines and curved-glass vignette (decorative) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ background: SCANLINES }} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.55) 100%)" }}
        />
      </div>

      {/* Monitor label */}
      <div className="mt-2 flex items-center justify-between px-2 text-[10px] font-bold tracking-[0.3em] text-[#8a7f66] sm:mt-3 sm:text-[11px]">
        <span>EP-1984</span>
        <span className="flex items-center gap-2">
          POWER <span className="h-2 w-2 rounded-full bg-[#39ff6e] shadow-[0_0_6px_#39ff6e]" />
        </span>
      </div>
    </div>
  );
}

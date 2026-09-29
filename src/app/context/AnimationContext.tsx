"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { EFFECTS, newRound, pushKey, type Effect, type EffectId } from "@/lib/fun/effects";

// The canvas effects (confetti, bubbles, parachutist) only load the first time one plays
const FunOverlay = dynamic(() => import("../fun/FunOverlay"), { ssr: false });

/** Fun mode state shared through `useAnimation()`. */
type AnimationContextType = {
  /** The effect playing now, or null. */
  effect: Effect | null;
  /**
   * Class for text that joins in (page titles, the homepage headline): "fun-wave" during Wave, else "".
   * The other effects style the whole page through `<html data-fun="…">`.
   */
  animationClass: string;
  /** Seconds until the current effect stops. */
  timeLeft: number;
  /** True when the visitor asked their device for less motion: effects use their calm versions. */
  reducedMotion: boolean;
  /** Plays the next effect (a shuffled round, never the same one twice in a row). */
  getNextAnimation: () => void;
  /** Plays one effect by id (used by the Konami code for the secret one). */
  start: (id: EffectId) => void;
  /** Stops fun mode now. */
  stop: () => void;
  /** True for a few seconds after the Konami code unlocks the secret effect. */
  secretFound: boolean;
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

/** Subscribes to the "reduce motion" setting. */
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  query?.addEventListener?.("change", onChange);
  return () => query?.removeEventListener?.("change", onChange);
}
/** The current "reduce motion" setting. */
const getReducedMotion = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** True while typing in a field, so arrow keys there don't count towards the Konami code. */
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName ?? "")));
}

/**
 * Holds fun mode: which effect is playing, the countdown (paused while the tab is hidden), the shuffled
 * queue, the "reduce motion" setting and the secret Konami code. Marks the page with
 * `<html data-fun="scuba">` (and `data-fun-calm` for reduced motion) so CSS can style it.
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  const [effectId, setEffectId] = useState<EffectId | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [secretFound, setSecretFound] = useState(false);
  const [run, setRun] = useState(0); // bumps on every start, so effects restart even when repeated
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => false);
  const queue = useRef<EffectId[]>([]);
  const last = useRef<EffectId | null>(null);
  const keys = useRef<string[]>([]);

  const stop = useCallback(() => {
    setEffectId(null);
    setTimeLeft(0);
  }, []);

  const start = useCallback((id: EffectId) => {
    last.current = id;
    setEffectId(id);
    setTimeLeft(EFFECTS[id].seconds);
    setRun((r) => r + 1);
  }, []);

  const getNextAnimation = useCallback(() => {
    if (!queue.current.length) queue.current = newRound(last.current);
    start(queue.current.shift()!);
  }, [start]);

  // Countdown, one second at a time; frozen while the tab is in the background
  useEffect(() => {
    if (!effectId) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setTimeLeft((t) => {
        if (t <= 1) {
          setEffectId(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [effectId, run]);

  // Let CSS style the whole page for the effect that's playing (re-set on each run so CSS animations restart)
  useEffect(() => {
    const root = document.documentElement;
    delete root.dataset.fun;
    if (effectId) {
      // Reading layout between removing and re-adding restarts CSS animations for a repeated effect
      void root.offsetWidth;
      root.dataset.fun = effectId;
    }
    if (effectId && reducedMotion) root.dataset.funCalm = "";
    else delete root.dataset.funCalm;
  }, [effectId, reducedMotion, run]);

  // The secret: ↑ ↑ ↓ ↓ ← → ← → E P anywhere on the site
  useEffect(() => {
    let hideToast: ReturnType<typeof setTimeout> | undefined;
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const { buffer, unlocked } = pushKey(keys.current, event.key);
      keys.current = unlocked ? [] : buffer;
      if (!unlocked) return;
      start("deepdrop");
      setSecretFound(true);
      clearTimeout(hideToast);
      hideToast = setTimeout(() => setSecretFound(false), 5000);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(hideToast);
    };
  }, [start]);

  const effect = effectId ? EFFECTS[effectId] : null;

  return (
    <AnimationContext.Provider
      value={{
        effect,
        animationClass: effectId === "wave" ? "fun-wave" : "",
        timeLeft,
        reducedMotion,
        getNextAnimation,
        start,
        stop,
        secretFound,
      }}
    >
      {children}
      {effect?.overlay && <FunOverlay key={run} effect={effect.id} calm={reducedMotion} />}
    </AnimationContext.Provider>
  );
}

/**
 * Returns the fun mode state and controls (see AnimationContextType).
 * Must be used inside AnimationProvider, otherwise it throws.
 */
export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used inside AnimationProvider");
  }
  return context;
}

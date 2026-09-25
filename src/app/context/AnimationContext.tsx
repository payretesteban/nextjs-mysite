"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";

/** Tailwind animation classes that fun mode cycles through. */
const HARDCODED_ANIMATIONS = [
  { class: "animate-bounce" },
  { class: "animate-spin" },
  { class: "animate-pulse" },
  { class: "animate-ping" },
  { class: "animate-wiggle" },
];

type Animation = {
  class: string;
};

/** Fun mode state shared through `useAnimation()`. */
type AnimationContextType = {
  /** Current animation class, or "" when fun mode is off. */
  animationClass: string;
  /** Seconds until the current animation stops. */
  timeLeft: number;
  /** Starts the next animation and restarts the countdown. */
  getNextAnimation: () => void;
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

/** Returns a shuffled copy of the array. Not perfectly random, but fine for picking animations. */
function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

/** How long each animation runs, in seconds. */
const ANIMATION_DURATION = 10;

/**
 * Holds fun mode state: the current animation class and a countdown. Each call to
 * `getNextAnimation` plays the next class from a shuffled queue for ANIMATION_DURATION seconds.
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  const [animationClass, setAnimationClass] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => clearTimers();
  }, []);

  function clearTimers() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  /**
   * Plays the next animation from the queue (reshuffled when empty) and restarts the timers.
   * Ignored before mount so nothing runs during server rendering.
   */
  function getNextAnimation() {
    if (!isMounted) return;

    let updatedQueue = [...queue];

    if (updatedQueue.length === 0) {
      updatedQueue = shuffleArray(HARDCODED_ANIMATIONS.map((a) => a.class));
    }

    const nextAnimation = updatedQueue[0];
    setAnimationClass(nextAnimation);
    setQueue(updatedQueue.slice(1));

    clearTimers();

    setTimeLeft(ANIMATION_DURATION);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      setAnimationClass("");
      setTimeLeft(0);
      clearTimers();
    }, ANIMATION_DURATION * 1000);
  }

  return (
    <AnimationContext.Provider value={{ animationClass, timeLeft, getNextAnimation }}>
      {children}
    </AnimationContext.Provider>
  );
}

/**
 * Returns the fun mode state: `animationClass`, `timeLeft` and `getNextAnimation`.
 * Must be used inside AnimationProvider, otherwise it throws.
 */
export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used inside AnimationProvider");
  }
  return context;
}
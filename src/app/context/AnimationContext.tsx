"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useEffect,
} from "react";

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

type AnimationContextType = {
  animationClass: string;
  timeLeft: number;
  getNextAnimation: () => void;
};

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

const ANIMATION_DURATION = 10;

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

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used inside AnimationProvider");
  }
  return context;
}
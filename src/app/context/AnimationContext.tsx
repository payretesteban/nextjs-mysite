"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from "react";

type Animation = {
  class: string;
};

type AnimationContextType = {
  animationClass: string;
  timeLeft: number;
  getNextAnimation: (animations: Animation[]) => void;
};

const AnimationContext = createContext<
  AnimationContextType | undefined
>(undefined);

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

const ANIMATION_DURATION = 10;

export function AnimationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [animationClass, setAnimationClass] =
    useState("");

  const [queue, setQueue] = useState<string[]>([]);

  const [timeLeft, setTimeLeft] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(
    null
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(
    null
  );

  function clearTimers() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }

  function getNextAnimation(animations: Animation[]) {
    let updatedQueue = queue;

    if (updatedQueue.length === 0) {
      updatedQueue = shuffleArray(
        animations.map((a) => a.class)
      );
    }

    const nextAnimation = updatedQueue[0];

    setAnimationClass(nextAnimation);

    setQueue(updatedQueue.slice(1));

    clearTimers();

    // start countdown
    setTimeLeft(ANIMATION_DURATION);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    // stop animation
    timeoutRef.current = setTimeout(() => {
      setAnimationClass("");
      setTimeLeft(0);

      clearTimers();
    }, ANIMATION_DURATION * 1000);
  }

  return (
    <AnimationContext.Provider
      value={{
        animationClass,
        timeLeft,
        getNextAnimation,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);

  if (!context) {
    throw new Error(
      "useAnimation must be used inside AnimationProvider"
    );
  }

  return context;
}
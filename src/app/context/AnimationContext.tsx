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
  getNextAnimation: (animations: Animation[]) => void;
};

const AnimationContext = createContext<
  AnimationContextType | undefined
>(undefined);

function shuffleArray<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export function AnimationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [animationClass, setAnimationClass] = useState("");

  const [queue, setQueue] = useState<string[]>([]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setAnimationClass("");
    }, 10000);
  }

  return (
    <AnimationContext.Provider
      value={{
        animationClass,
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
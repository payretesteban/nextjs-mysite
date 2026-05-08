"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type AnimationContextType = {
  animationClass: string;
  setAnimationClass: (value: string) => void;
};

const AnimationContext = createContext<
  AnimationContextType | undefined
>(undefined);

export function AnimationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [animationClass, setAnimationClass] = useState("");

  return (
    <AnimationContext.Provider
      value={{
        animationClass,
        setAnimationClass,
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
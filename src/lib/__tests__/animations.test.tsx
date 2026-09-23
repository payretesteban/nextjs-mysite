import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AnimatedHeadline, { Animated } from "../animations";
import { AnimationProvider, useAnimation } from "@/app/context/AnimationContext";

describe("AnimatedHeadline Component", () => {
  it("renders headline text with animation context styling", () => {
    const text = "Tech Lead & Software Engineer";

    render(
      <AnimationProvider>
        <AnimatedHeadline headline={text} />
      </AnimationProvider>
    );

    const headlineElem = screen.getByText(text);
    expect(headlineElem).toBeInTheDocument();
    expect(headlineElem.tagName).toBe("P");
  });
});

function FunButton() {
  const { getNextAnimation } = useAnimation();
  return <button onClick={getNextAnimation}>Fun</button>;
}

describe("Animated", () => {
  it("renders its children as an inline-block with no animation by default", () => {
    render(
      <AnimationProvider>
        <h1>
          <Animated>Test Suite</Animated>
        </h1>
      </AnimationProvider>
    );
    const el = screen.getByText("Test Suite");
    expect(el.tagName).toBe("SPAN");
    expect(el.className).toBe("inline-block");
  });

  it("picks up the current animation when fun mode starts", () => {
    render(
      <AnimationProvider>
        <FunButton />
        <Animated>My post</Animated>
      </AnimationProvider>
    );
    fireEvent.click(screen.getByText("Fun"));
    expect(screen.getByText("My post").className).toMatch(/animate-(bounce|spin|pulse|ping|wiggle)/);
  });
});

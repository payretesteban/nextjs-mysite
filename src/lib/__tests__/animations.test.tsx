import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnimatedHeadline from "../animations";
import { AnimationProvider } from "@/app/context/AnimationContext";

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

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdventurePage, { metadata } from "../page";

vi.mock("next/font/google", () => ({ VT323: () => ({ variable: "font-vt323" }) }));
vi.mock("@/lib/animations", () => ({ Animated: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../Adventure", () => ({ default: () => <p>The game</p> }));

describe("The Deep Drop page", () => {
  it("shows the intro, the game in its retro font and the safety note", () => {
    const { container } = render(<AdventurePage />);
    expect(screen.getByRole("heading", { level: 1, name: "The Deep Drop" })).toBeInTheDocument();
    expect(screen.getByText("The game")).toBeInTheDocument();
    expect(container.querySelector("section")?.className).toMatch(/font-vt323/);
    expect(screen.getByText(/It isn.t training/)).toBeInTheDocument();
    expect(metadata.title).toBe("The Deep Drop");
  });
});

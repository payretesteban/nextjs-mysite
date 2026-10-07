import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReadListenPage, { metadata } from "../page";
import type { ReadListenText } from "@/lib/readListen/options";

vi.mock("@/lib/animations", () => ({ Animated: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../ReadListen", () => ({
  default: ({ initial }: { initial: ReadListenText }) => (
    <p>
      Starts with {initial.topic}, level {initial.level} ({initial.source})
    </p>
  ),
}));

describe("Read & Listen page", () => {
  it("shows the title and starts with the built-in A2 market text", () => {
    render(<ReadListenPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Read & Listen" })).toBeInTheDocument();
    expect(screen.getByText("Starts with market, level A2 (library)")).toBeInTheDocument();
    expect(metadata.title).toBe("Read & Listen");
  });
});

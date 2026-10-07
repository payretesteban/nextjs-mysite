import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TestsPage, { metadata } from "../page";

vi.mock("@/lib/animations", () => ({ Animated: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../TestRunner", () => ({ default: ({ mode }: { mode: string }) => <p>Mode: {mode}</p> }));

describe("Tests page", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("runs the tests live in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<TestsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Test Suite" })).toBeInTheDocument();
    expect(screen.getByText("Mode: live")).toBeInTheDocument();
    expect(metadata.title).toBe("Tests");
  });

  it("shows the build's saved results everywhere else", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<TestsPage />);
    expect(screen.getByText("Mode: snapshot")).toBeInTheDocument();
  });
});

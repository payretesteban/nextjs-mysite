import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PerformancePage, { metadata } from "../page";
import { SITE_URL } from "@/lib/pagespeed";

vi.mock("@/lib/animations", () => ({ Animated: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../PerformanceRunner", () => ({ default: ({ url }: { url: string }) => <p>Runner for {url}</p> }));

describe("Performance page", () => {
  it("shows the title and tests the live homepage", () => {
    render(<PerformancePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Performance" })).toBeInTheDocument();
    expect(screen.getByText(`Runner for ${SITE_URL}`)).toBeInTheDocument();
    expect(metadata.title).toBe("Performance");
  });
});

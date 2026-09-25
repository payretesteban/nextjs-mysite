import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "../../not-found";

vi.mock("@/lib/animations", () => ({
  Animated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("404 page", () => {
  it("says the page wasn't found and offers a way home or to all posts", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /homepage/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /see all posts/i })).toHaveAttribute("href", "/posts");
  });
});

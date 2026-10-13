import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PageError from "../error";
import GlobalError from "../global-error";

describe("Error pages", () => {
  it("explains a page that failed to load, with a reference, and can try again", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<PageError error={Object.assign(new Error("Sanity down"), { digest: "abc123" })} reset={reset} />);
    expect(screen.getByRole("heading", { level: 1, name: "This page didn't load" })).toBeInTheDocument();
    expect(screen.getByText("Reference: abc123")).toBeInTheDocument();
    expect(screen.queryByText(/Sanity down/)).not.toBeInTheDocument(); // no internal details shown
    expect(screen.getByRole("link", { name: "Go to the homepage" })).toHaveAttribute("href", "/");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
  });

  it("has a last-resort page for when the whole layout fails", () => {
    const reset = vi.fn();
    // global-error renders its own <html>; render its body content into a container
    render(<GlobalError error={new Error("boom")} reset={reset} />, { container: document.documentElement });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "The site didn't load" })).toBeInTheDocument();
  });
});

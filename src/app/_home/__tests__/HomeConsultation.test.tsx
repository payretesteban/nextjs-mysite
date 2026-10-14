import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import HomeConsultation from "../HomeConsultation";
import { DEFAULT_CONSULTATION } from "@/lib/consultation";

describe("Homepage consultation panel", () => {
  afterEach(() => vi.useRealTimers());

  it("lists how it works as numbered steps (shown beside the buttons on wide screens)", () => {
    const { container } = render(<HomeConsultation consultation={DEFAULT_CONSULTATION} serviceNames={[]} />);
    const steps = container.querySelector("[data-steps]")!;
    expect(steps).toHaveClass("hidden", "xl:block");
    expect(within(steps as HTMLElement).getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    const items = within(steps as HTMLElement).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("01Pick a timeAny free slot in my calendar");
  });

  it("leaves the steps out when there are none", () => {
    const { container } = render(<HomeConsultation consultation={{ ...DEFAULT_CONSULTATION, homeSteps: [] }} />);
    expect(container.querySelector("[data-steps]")).toBeNull();
  });

  it("links to the services and rotates through their names, with the full list for screen readers", () => {
    vi.useFakeTimers();
    render(<HomeConsultation consultation={DEFAULT_CONSULTATION} serviceNames={["Web Development", "AI workflows"]} />);
    expect(screen.getByRole("link", { name: "Explore My Services" })).toHaveAttribute("href", "/services");
    expect(screen.getByText("2 services, including Web Development, AI workflows")).toHaveClass("sr-only");
    const active = () => document.querySelector("[data-services-ticker] .animate-ticker");
    expect(active()).toHaveTextContent("Web Development");
    act(() => vi.advanceTimersByTime(2600));
    expect(active()).toHaveTextContent("AI workflows");
  });

  it("holds the name still while the visitor points at the services button", () => {
    vi.useFakeTimers();
    render(<HomeConsultation consultation={DEFAULT_CONSULTATION} serviceNames={["Web Development", "AI workflows"]} />);
    act(() => {
      screen.getByRole("link", { name: "Explore My Services" }).dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    act(() => vi.advanceTimersByTime(6000));
    expect(document.querySelector("[data-services-ticker] .animate-ticker")).toHaveTextContent("Web Development");
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ScopeWizard from "../ScopeWizard";

vi.mock("../../contact/ContactProvider", () => ({ useContact: () => ({ open: vi.fn() }) }));

/** Clicks the choice with this label on the current screen. */
const pick = (name: RegExp | string) => fireEvent.click(screen.getByRole("radio", { name }));

describe("Project Scoping Assistant", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    window.history.replaceState(null, "", "/scope");
    fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ summary: "An AI-written summary of the estimate.", source: "ai" }) });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("walks through the questions and shows the snapshot with what moves the estimate", async () => {
    render(<ScopeWizard bookingUrl="https://cal.com/esteban/30min" bookLabel="Book a Free Consultation" />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByRole("heading", { name: "What are you building?" })).toHaveFocus();
    pick(/Web app/);
    pick(/A prototype/);
    pick(/Hundreds/);
    fireEvent.click(screen.getByRole("checkbox", { name: /User accounts/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /AI features/ }));
    expect(screen.getByRole("checkbox", { name: /AI features/ })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    pick(/need leadership/);
    pick(/3–6 months/);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Online booking for a clinic." } });
    fireEvent.click(screen.getByRole("button", { name: /see my snapshot/i }));

    expect(screen.getByRole("heading", { name: "Your project snapshot" })).toBeInTheDocument();
    // 8 web app + 2 accounts + 4 AI − 2 prototype + 1 hundreds of users = 13 → 10–17 weeks
    expect(screen.getByRole("article")).toHaveTextContent("10–17 weeks with one senior developer");
    const moves = screen.getByRole("region", { name: "What moves the estimate" });
    expect(within(moves).getByText("Web app (starting point)")).toBeInTheDocument();
    expect(within(moves).getByText("−2 wk")).toBeInTheDocument();

    // The AI summary replaces the template one; the note goes to the server but not into the link
    expect(await screen.findByText("An AI-written summary of the estimate.")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ kind: "webapp", notes: "Online booking for a clinic." });
    expect(window.location.hash).toContain("k=webapp");
    expect(window.location.hash).not.toContain("clinic");
    expect(screen.getByRole("link", { name: "Book a Free Consultation" })).toBeInTheDocument();
  });

  it("goes back a step and can start over", () => {
    render(<ScopeWizard bookLabel="Book" />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    pick(/Website/);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByRole("radio", { name: /Website/ })).toHaveAttribute("aria-checked", "true");
  });

  it("opens a shared snapshot straight from the link", async () => {
    window.history.replaceState(null, "", "/scope#k=website&s=designs&u=small&f=content&t=none&w=quarter&b=skip");
    render(<ScopeWizard bookLabel="Book" />);
    expect(await screen.findByRole("heading", { name: "Your project snapshot" })).toBeInTheDocument();
    expect(screen.getByText(/Fits your 1–3 months timeline/)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("button", { name: /start over/i }));
    expect(screen.getByRole("heading", { name: "What are you building?" })).toBeInTheDocument();
    expect(window.location.hash).toBe("");
  });
});

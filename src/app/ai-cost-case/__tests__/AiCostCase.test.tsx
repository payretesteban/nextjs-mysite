import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CaseProvider } from "../CaseContext";
import { Calculator, ChangesTable, CostBreakdown } from "../CaseNumbers";
import FlowExplorer from "../FlowExplorer";

vi.mock("@/app/context/AnimationContext", () => ({ useAnimation: () => ({ reducedMotion: false }) }));

/** The interactive parts of the page, sharing one set of numbers like on the real page. */
function renderCase() {
  return render(
    <CaseProvider>
      <FlowExplorer />
      <CostBreakdown />
      <ChangesTable />
      <Calculator />
    </CaseProvider>
  );
}

describe("AI cost case page", () => {
  it("starts on the old setup, with the sync agent explained and the old numbers", () => {
    renderCase();
    expect(screen.getByRole("button", { name: /Before/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Sync agent/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Every run, the largest model reads/)).toBeInTheDocument();
    expect(screen.getByText("324M")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Warehouse/ })).not.toBeInTheDocument();
  });

  it("switches to the lean flow, showing new numbers next to the old ones", () => {
    renderCase();
    fireEvent.click(screen.getByRole("button", { name: /After/ }));
    expect(screen.getByRole("button", { name: /Warehouse/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: /Sync agent/ })).not.toBeInTheDocument();
    expect(screen.getByText("No AI: 0 tokens, $0 a month")).toBeInTheDocument();
    expect(screen.getByText("24.4M")).toBeInTheDocument();
    expect(screen.getAllByText("324M").length).toBeGreaterThan(0); // struck-through old value
  });

  it("explains any box that's selected", () => {
    renderCase();
    fireEvent.click(screen.getByRole("button", { name: /Report agent/ }));
    expect(screen.getByText(/the numbers drift from week to week/)).toBeInTheDocument();
    expect(screen.getByText(/Large model · 8.6M tokens · \$44 a month/)).toBeInTheDocument();
  });

  it("lets the moving data be paused", () => {
    renderCase();
    fireEvent.click(screen.getByRole("button", { name: /Pause the data/ }));
    expect(screen.getByRole("button", { name: /Play the data/ })).toBeInTheDocument();
  });

  it("shows where the money went, biggest cost first", () => {
    renderCase();
    const rows = within(screen.getByRole("list", { name: /Monthly AI cost before/ })).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent(/Contact summaries.*\$1,342/);
    expect(rows).toHaveLength(4);
  });

  it("updates every number when the calculator changes, and can reset", () => {
    renderCase();
    expect(screen.getByRole("row", { name: /Data sync/ })).toHaveTextContent("140M");
    fireEvent.change(screen.getByRole("slider", { name: /Old sync agent runs per day/ }), { target: { value: "24" } });
    expect(screen.getByRole("row", { name: /Data sync/ })).not.toHaveTextContent("140M");
    expect(screen.getByText(/every 60 min/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset to Brightline Home" }));
    expect(screen.getByRole("row", { name: /Data sync/ })).toHaveTextContent("140M");
    expect(screen.queryByRole("button", { name: "Reset to Brightline Home" })).not.toBeInTheDocument();
  });
});

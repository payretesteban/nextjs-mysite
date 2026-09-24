import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SiteLogPage from "../page";

vi.mock("@/lib/animations", () => ({
  Animated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/siteLog", () => ({
  getSiteLog: vi.fn(async () => [
    { _id: "a", title: "The Genesis", text: "It all began." },
    { _id: "b", title: "The Miracle", text: "Stared at the code." },
  ]),
}));

describe("/site-log page", () => {
  it("shows every site log entry as a numbered note", async () => {
    render(await SiteLogPage());
    expect(screen.getByRole("heading", { level: 1, name: /site log/i })).toBeInTheDocument();
    const notes = screen.getAllByRole("listitem");
    expect(notes).toHaveLength(2);
    expect(notes[0]).toHaveTextContent("#01The GenesisIt all began.");
    expect(notes[1]).toHaveTextContent("#02The Miracle");
  });
});

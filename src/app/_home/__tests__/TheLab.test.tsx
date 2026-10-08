import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TheLab from "../TheLab";
import type { LabItem } from "@/lib/lab";

vi.mock("../LabStrip", () => ({
  default: ({ label, children }: { label: string; children: React.ReactNode[] }) => (
    <ul aria-label={label}>
      {children.map((c, i) => (
        <li key={i}>{c}</li>
      ))}
    </ul>
  ),
}));

const item = (over: Partial<LabItem>): LabItem => ({ _id: "x", href: "/x", title: "X", blurb: "", tech: [], status: "live", preview: "generic", ...over });

describe("The Lab cards", () => {
  it("opens pages on this site in the same tab", () => {
    render(<TheLab items={[item({ _id: "a", href: "/scope", title: "Project Scoping" })]} tests={null} />);
    const card = screen.getByRole("link", { name: /Project Scoping/ });
    expect(card).toHaveAttribute("href", "/scope");
    expect(card).not.toHaveAttribute("target");
  });

  it("opens other sites in a new tab, says so, and shows the site's address in the picture", () => {
    const href = "https://247631214.hs-sites-na2.com/esteban-payret-tech-lead-people-manager-hubspot-version";
    render(<TheLab items={[item({ _id: "b", href, title: "HubSpot version", preview: "website" })]} tests={null} />);
    const card = screen.getByRole("link", { name: /HubSpot version.*opens another site in a new tab/ });
    expect(card).toHaveAttribute("href", href);
    expect(card).toHaveAttribute("target", "_blank");
    expect(card).toHaveAttribute("rel", "noopener noreferrer");
    expect(card).toHaveTextContent("247631214.hs-sites-na2.com");
  });
});

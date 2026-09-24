import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import Header from "../header";
import { AnimationProvider } from "../context/AnimationContext";
import type { SanityLink } from "@/lib/types";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => mockUsePathname() }));

const links: SanityLink[] = [
  { _id: "1", title: "Home", url: "/", category: "internal" },
  { _id: "2", title: "Run site tests", url: "/tests", category: "internal" },
  { _id: "3", title: "GitHub", url: "https://github.com" },
];

const ui = (
  <AnimationProvider>
    <Header links={links} name="Esteban Payret" />
  </AnimationProvider>
);

describe("Loading the header", () => {
  it("hydrates without a mismatch even when the server doesn't know the pathname", async () => {
    // Server render: the prerendered layout may not have a pathname
    mockUsePathname.mockReturnValue(null);
    const html = renderToString(ui);

    // Client: the real pathname is known
    mockUsePathname.mockReturnValue("/");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, ui, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    // After hydration the homepage menu shows the internal pages
    expect(container.textContent).toContain("Run site tests");
  });
});

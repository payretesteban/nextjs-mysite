import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import CommandMenu, { type MenuItem } from "../command-menu";

const run = vi.fn();
const ITEMS: MenuItem[] = [
  { id: "home", label: "Home", group: "Pages", icon: "home", href: "/" },
  { id: "services", label: "Services", group: "Pages", icon: "briefcase", href: "/services", keywords: "consulting hire" },
  { id: "github", label: "GitHub", group: "Elsewhere", icon: "github", href: "https://github.com/me", external: true },
  { id: "fun", label: "Some fun", group: "Actions", icon: "page", run },
];

/** The menu with real open/close state, plus a button to open it like the header does. */
function Harness({ onChange }: { onChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open menu</button>
      <CommandMenu
        items={ITEMS}
        open={open}
        onOpenChange={(next) => {
          onChange?.(next);
          setOpen(next);
        }}
      />
    </>
  );
}

/** Renders and opens the menu; returns the dialog and the search box. */
function openMenu(onChange?: (open: boolean) => void) {
  render(<Harness onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  return { dialog: document.querySelector("dialog")!, input: screen.getByRole("combobox") };
}

/** Which item is highlighted. */
const highlighted = () => screen.getAllByRole("option").find((o) => o.getAttribute("aria-selected") === "true")?.textContent;

describe("⌘K menu keyboard and mouse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    run.mockClear();
  });

  it("moves the highlight with the arrow keys, wrapping around at both ends", () => {
    const { input } = openMenu();
    expect(highlighted()).toMatch(/^Home/);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(highlighted()).toMatch(/^Some fun/);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(highlighted()).toMatch(/^Home/);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(highlighted()).toMatch(/^Services/);
  });

  it("jumps to the first and last item with Home and End", () => {
    const { input } = openMenu();
    fireEvent.keyDown(input, { key: "End" });
    expect(highlighted()).toMatch(/^Some fun/);
    fireEvent.keyDown(input, { key: "Home" });
    expect(highlighted()).toMatch(/^Home/);
  });

  it("highlights the item under the mouse and runs it with Enter", () => {
    const { input } = openMenu();
    fireEvent.mouseMove(screen.getByRole("option", { name: /Some fun/ }));
    expect(highlighted()).toMatch(/^Some fun/);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("finds items by their hidden keywords, and ignores keys when nothing matches", () => {
    const { input } = openMenu();
    fireEvent.change(input, { target: { value: "hire" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([expect.stringMatching(/^Services/)]);

    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText(/No results for/)).toHaveTextContent("zzz");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(run).not.toHaveBeenCalled();
  });

  it("closes on a backdrop click and starts with an empty search next time", () => {
    const onChange = vi.fn();
    const { dialog, input } = openMenu(onChange);
    fireEvent.change(input, { target: { value: "git" } });
    fireEvent.click(dialog);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(dialog).not.toHaveAttribute("open");
    expect(document.documentElement.style.overflow).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(highlighted()).toMatch(/^Home/);
  });

  it("follows the browser when it closes the menu itself (Esc)", () => {
    const onChange = vi.fn();
    const { dialog } = openMenu(onChange);
    fireEvent(dialog, new Event("close"));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("focuses the search box on desktop", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    try {
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
      const desktop = openMenu();
      act(() => vi.advanceTimersByTime(20));
      expect(desktop.input).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("focuses the menu itself on touch screens, so the keyboard doesn't pop up", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
    try {
      vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("coarse"), media: q, addEventListener() {}, removeEventListener() {} }));
      const { dialog, input } = openMenu();
      act(() => vi.advanceTimersByTime(20));
      expect(input).not.toHaveFocus();
      expect(dialog).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("uses the real dialog methods when the browser has them", () => {
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    const close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    });
    const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
    const saved = { showModal: proto.showModal, close: proto.close };
    proto.showModal = showModal;
    proto.close = close;
    try {
      const { dialog } = openMenu();
      expect(showModal).toHaveBeenCalled();
      fireEvent.click(dialog);
      expect(close).toHaveBeenCalled();
    } finally {
      proto.showModal = saved.showModal;
      proto.close = saved.close;
    }
  });
});

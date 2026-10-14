import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ThemePicker from "../ThemePicker";

const root = document.documentElement;
const open = () => fireEvent.click(screen.getByRole("button", { name: "Theme and colours" }));

describe("Theme picker", () => {
  beforeEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.mode;
  });

  it("opens a panel with the themes and the light/dark switch", () => {
    render(<ThemePicker />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open();
    expect(screen.getByRole("button", { name: "Theme and colours" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("radio", { name: /Clean/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Circuit/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /High contrast/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Retro CRT/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /System/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /Clean/ })).toHaveFocus();
  });

  it("switches the theme straight away and remembers it", () => {
    render(<ThemePicker />);
    open();
    fireEvent.click(screen.getByRole("radio", { name: /Retro CRT/ }));
    expect(root.dataset).toMatchObject({ theme: "retro", mode: "dark" });
    expect(localStorage.getItem("ep-theme")).toBe("retro");
    expect(screen.getByRole("radio", { name: /Retro CRT/ })).toHaveAttribute("aria-checked", "true");
    // Light/dark only applies to the Default theme
    expect(screen.getByRole("radio", { name: /Light/ })).toBeDisabled();
    expect(screen.getByText("Light and dark apply to the Clean theme.")).toBeInTheDocument();
  });

  it("switches light and dark for the Clean theme, or follows the device", () => {
    render(<ThemePicker />);
    open();
    fireEvent.click(screen.getByRole("radio", { name: /Dark/ }));
    expect(root.dataset.mode).toBe("dark");
    expect(localStorage.getItem("ep-mode")).toBe("dark");
    fireEvent.click(screen.getByRole("radio", { name: /System/ }));
    expect(root.dataset.mode).toBeUndefined();
  });

  it("switches to Circuit, the default theme", () => {
    render(<ThemePicker />);
    open();
    fireEvent.click(screen.getByRole("radio", { name: /Circuit/ }));
    expect(root.dataset).toMatchObject({ theme: "circuit", mode: "dark" });
  });

  it("moves between themes with the arrow keys", () => {
    render(<ThemePicker />);
    open();
    fireEvent.keyDown(screen.getByRole("radio", { name: /Clean/ }), { key: "ArrowRight" });
    expect(root.dataset.theme).toBe("contrast");
    expect(screen.getByRole("radio", { name: /High contrast/ })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("radio", { name: /High contrast/ }), { key: "ArrowLeft" });
    expect(root.dataset.theme).toBeUndefined();
  });

  it("closes with Esc (focus back on the button) or a click outside", () => {
    render(
      <>
        <ThemePicker />
        <p>Outside</p>
      </>
    );
    open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme and colours" })).toHaveFocus();
    open();
    fireEvent.pointerDown(screen.getByText("Outside"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a seasonal theme out of season only while it's the one on (e.g. from a preview link)", () => {
    root.dataset.theme = "halloween";
    render(<ThemePicker />);
    open();
    expect(screen.getByRole("radio", { name: /Halloween/ })).toHaveAttribute("aria-checked", "true");
  });
});

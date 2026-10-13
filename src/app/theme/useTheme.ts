"use client";

import { useSyncExternalStore } from "react";
import { STORAGE, isMode, isThemeId, modeAttribute, type Mode, type ThemeId } from "@/lib/themes";

/** Components showing the theme, re-rendered when it changes. */
const listeners = new Set<() => void>();

/** Reads one saved value (storage can be blocked, e.g. in some private windows). */
function read(name: string): string | null {
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

/** Saves one value, quietly doing nothing if storage is blocked. */
function write(name: string, value: string) {
  try {
    window.localStorage.setItem(name, value);
  } catch {
    // The choice still applies until the page is reloaded
  }
}

/** The theme on the page (set by the head script or by a choice in the picker). */
function currentTheme(): ThemeId {
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : "default";
}

/** The visitor's light/dark choice (kept even while another theme is on). */
function currentMode(): Mode {
  const value = read(STORAGE.mode);
  return isMode(value) ? value : "system";
}

/** Puts a theme and mode on <html>, where the CSS picks them up. */
function apply(theme: ThemeId, mode: Mode) {
  const root = document.documentElement;
  if (theme === "default") delete root.dataset.theme;
  else root.dataset.theme = theme;
  const attribute = modeAttribute(theme, mode);
  if (attribute) root.dataset.mode = attribute;
  else delete root.dataset.mode;
  listeners.forEach((listener) => listener());
}

/** Switches the site's theme and remembers it. */
export function setTheme(theme: ThemeId) {
  write(STORAGE.theme, theme);
  apply(theme, currentMode());
}

/** Switches light/dark/system (for the Default theme) and remembers it. */
export function setMode(mode: Mode) {
  write(STORAGE.mode, mode);
  apply(currentTheme(), mode);
}

/** Subscribes to theme changes (useSyncExternalStore). */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The current theme and mode, e.g. { theme: "retro", mode: "system" }. The server render assumes the
 * defaults; the real values (already applied to the page by the head script) take over after hydration.
 */
export function useTheme(): { theme: ThemeId; mode: Mode } {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => `${currentTheme()}|${currentMode()}`,
    () => "default|system"
  );
  const [theme, mode] = snapshot.split("|") as [ThemeId, Mode];
  return { theme, mode };
}

/** True when the page currently looks dark (a dark theme, dark mode, or the device's dark setting). */
export function pageLooksDark(): boolean {
  const root = document.documentElement;
  if (root.dataset.theme && root.dataset.theme !== "default") return true;
  if (root.dataset.mode) return root.dataset.mode === "dark";
  return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
}

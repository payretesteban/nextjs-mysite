import { describe, it, expect, beforeEach } from "vitest";
import { THEMES, availableThemes, currentSeason, getTheme, inSeason, isMode, isThemeId, modeAttribute, themeInitScript } from "../themes";

const halloween = getTheme("halloween");
const day = (month: number, date: number) => new Date(2026, month - 1, date, 12);

describe("Themes", () => {
  it("lists Default, High contrast, Retro and Halloween, each with a preview", () => {
    expect(THEMES.map((t) => t.id)).toEqual(["default", "contrast", "retro", "halloween"]);
    for (const t of THEMES) expect(t.swatches).toHaveLength(3);
    expect(getTheme("nope").id).toBe("default");
    expect(isThemeId("retro")).toBe(true);
    expect(isThemeId("summer")).toBe(false);
    expect(isMode("dark")).toBe(true);
    expect(isMode("dim")).toBe(false);
  });

  it("offers Halloween from October 1 to November 1, and invites visitors from October 15", () => {
    expect(inSeason(halloween, day(9, 30))).toBe(false);
    expect(inSeason(halloween, day(10, 1))).toBe(true);
    expect(inSeason(halloween, day(11, 1))).toBe(true);
    expect(inSeason(halloween, day(11, 2))).toBe(false);
    expect(availableThemes(day(9, 30)).map((t) => t.id)).toEqual(["default", "contrast", "retro"]);
    expect(availableThemes(day(10, 13)).map((t) => t.id)).toContain("halloween");
    expect(currentSeason(day(10, 14))).toBeNull(); // in the picker, but no invitation yet
    expect(currentSeason(day(10, 15))?.id).toBe("halloween");
    expect(currentSeason(day(11, 1))?.id).toBe("halloween");
    expect(currentSeason(day(6, 1))).toBeNull();
  });

  it("handles seasons that wrap around New Year", () => {
    const winter = { ...halloween, season: { ...halloween.season!, from: [12, 15] as [number, number], to: [1, 5] as [number, number], inviteFrom: [12, 20] as [number, number] } };
    expect(inSeason(winter, day(12, 31))).toBe(true);
    expect(inSeason(winter, day(1, 3))).toBe(true);
    expect(inSeason(winter, day(2, 1))).toBe(false);
  });

  it("builds every theme but Default on the dark styles; Default follows the visitor", () => {
    expect(modeAttribute("retro", "light")).toBe("dark");
    expect(modeAttribute("default", "system")).toBeNull();
    expect(modeAttribute("default", "light")).toBe("light");
    expect(modeAttribute("default", "dark")).toBe("dark");
  });
});

describe("Applying the saved theme before the page paints", () => {
  const root = document.documentElement;
  /** Runs the head script with a page address and today's date. */
  function run(search = "", now = day(10, 20)) {
    window.history.replaceState(null, "", `/${search}`);
    const RealDate = Date;
    globalThis.Date = class extends RealDate {
      constructor(...args: []) {
        super(...(args.length ? args : [now.getTime()]) as []);
      }
    } as DateConstructor;
    try {
      new Function(themeInitScript())();
    } finally {
      globalThis.Date = RealDate;
    }
  }

  beforeEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.mode;
  });

  it("does nothing for a first-time visitor (Default theme, device light/dark)", () => {
    run();
    expect(root.dataset.theme).toBeUndefined();
    expect(root.dataset.mode).toBeUndefined();
  });

  it("applies a saved theme and mode", () => {
    localStorage.setItem("ep-theme", "retro");
    run();
    expect(root.dataset).toMatchObject({ theme: "retro", mode: "dark" });

    delete root.dataset.theme;
    delete root.dataset.mode;
    localStorage.setItem("ep-theme", "default");
    localStorage.setItem("ep-mode", "light");
    run();
    expect(root.dataset.theme).toBeUndefined();
    expect(root.dataset.mode).toBe("light");
  });

  it("drops a seasonal theme once its season is over, and ignores junk", () => {
    localStorage.setItem("ep-theme", "halloween");
    run("", day(11, 10));
    expect(root.dataset.theme).toBeUndefined();
    localStorage.setItem("ep-theme", "<script>");
    localStorage.setItem("ep-mode", "sepia");
    run();
    expect(root.dataset.theme).toBeUndefined();
    expect(root.dataset.mode).toBeUndefined();
  });

  it("lets a ?theme= link preview any theme, even out of season, and remembers it", () => {
    run("?theme=halloween", day(6, 1));
    expect(root.dataset.theme).toBe("halloween");
    expect(localStorage.getItem("ep-theme")).toBe("halloween");
  });
});

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Every component file in src/, except tests. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : sourceFiles(full);
    return full.endsWith(".tsx") ? [full] : [];
  });
}

const SRC = path.resolve(__dirname, "../..");
/** A class list in quotes or backticks. */
const CLASS_LIST = /"[^"\n]*"|`[^`]*`/g;
/** Mid-grey text that is fine on white but too faint on the near-black dark background (about 4.2:1 and 2.6:1). */
const FAINT_IN_DARK = /(?<![:\w-])text-slate-(500|600)(?![\w-])/;

describe("Readable in dark mode", () => {
  it("gives every mid-grey text a lighter colour in dark mode", () => {
    const problems = sourceFiles(SRC).flatMap((file) =>
      (readFileSync(file, "utf8").match(CLASS_LIST) ?? [])
        .filter((classes) => FAINT_IN_DARK.test(classes) && !/dark:text-/.test(classes))
        .map((classes) => `${path.relative(SRC, file)}: ${classes.slice(0, 80)}`)
    );
    expect(problems).toEqual([]);
  });

  it("inverts the homepage bio's text colours in dark mode", () => {
    const home = readFileSync(path.join(SRC, "app/page.tsx"), "utf8");
    expect(home).toMatch(/className="prose[^"]*dark:prose-invert/);
  });
});

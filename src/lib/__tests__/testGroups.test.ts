import { describe, it, expect } from "vitest";
import { areaForFile, groupByArea } from "../testGroups";
import type { TestFileResult } from "../testResults";

const test = (name: string, status: "passed" | "failed" | "skipped" = "passed", ancestors = ["Group"]) => ({
  name,
  fullName: [...ancestors, name].join(" "),
  ancestors,
  status,
  durationMs: 1,
  failureMessages: [],
});
const file = (path: string, tests: ReturnType<typeof test>[], error: string | null = null): TestFileResult => ({
  file: path,
  status: error || tests.some((t) => t.status === "failed") ? "failed" : "passed",
  durationMs: 10,
  error,
  tests,
});

describe("Grouping tests by part of the site", () => {
  it("puts every current test file in a named area", () => {
    const cases: [string, string][] = [
      ["src/app/_home/__tests__/PostList.test.tsx", "Homepage"],
      ["src/app/services/__tests__/ServicesTicker.test.tsx", "Homepage"],
      ["src/app/site-log/__tests__/page.test.tsx", "Homepage"],
      ["src/app/_home/__tests__/HomePage.test.tsx", "Homepage"],
      ["src/app/[slug]/__tests__/page.test.tsx", "Posts"],
      ["src/app/posts/__tests__/page.test.tsx", "Posts"],
      ["src/app/api/contact/__tests__/route.test.ts", "Contact form"],
      ["src/lib/__tests__/contact.test.ts", "Contact form"],
      ["src/app/services/__tests__/ServiceList.test.tsx", "Services"],
      ["src/lib/adventure/__tests__/engine.test.ts", "The Deep Drop game"],
      ["src/lib/__tests__/pagespeed.test.ts", "Performance page"],
      ["src/app/__tests__/header.hydration.test.tsx", "Header, menu & footer"],
      ["src/app/__tests__/robotsAndSitemap.test.ts", "SEO"],
      ["src/app/context/__tests__/AnimationContext.test.tsx", "Fun mode"],
      ["src/app/tests/__tests__/TestRunner.test.tsx", "This tests page"],
      ["scripts/__tests__/capture-test-results.test.ts", "This tests page"],
      ["src/lib/__tests__/testGroups.test.ts", "This tests page"],
      ["src/lib/__tests__/somethingNew.test.ts", "Everything else"],
    ];
    for (const [path, label] of cases) expect(areaForFile(path).label, path).toBe(label);
  });

  it("orders areas like the site, counts results and splits them into test groups", () => {
    const groups = groupByArea([
      file("src/app/__tests__/footer.test.tsx", [test("shows the year", "passed", ["Footer"])]),
      file("src/lib/__tests__/contact.test.ts", [test("checks email", "passed", ["Checking the form fields"])]),
      file("src/app/api/contact/__tests__/route.test.ts", [
        test("sends", "passed", ["Sending the email"]),
        test("limits", "failed", ["Sending the email"]),
      ]),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Contact form", "Header, menu & footer"]);
    const contact = groups[0];
    expect(contact).toMatchObject({ total: 3, passed: 2, failed: 1, status: "failed" });
    expect(contact.sections.map((s) => s.title)).toEqual(["Checking the form fields", "Sending the email"]);
    expect(groups[1].status).toBe("passed");
  });

  it("marks an area as failed when a file couldn't run at all", () => {
    const [group] = groupByArea([file("src/lib/__tests__/seo.test.ts", [], "SyntaxError: oops")]);
    expect(group.status).toBe("failed");
    expect(group.fileErrors).toEqual([{ file: "src/lib/__tests__/seo.test.ts", error: "SyntaxError: oops" }]);
  });
});

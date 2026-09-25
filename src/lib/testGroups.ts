import type { TestCaseResult, TestFileResult } from "./testResults";

/** A part of the site that tests are grouped under on the /tests page. */
export interface TestArea {
  key: string;
  label: string;
  description: string;
  /** Matched against the test file's path; the first area that matches wins. */
  match: RegExp;
}

/** Parts of the site, in the order the /tests page lists them. */
export const TEST_AREAS: TestArea[] = [
  { key: "home", label: "Homepage", description: "Posts, site log notes and the services link", match: /_home\/|ServicesTicker|site-log|siteLog|lib\/__tests__\/data\.test/ },
  { key: "posts", label: "Posts", description: "Each post's page and the list of all posts", match: /\[slug\]|app\/posts\// },
  { key: "contact", label: "Contact form", description: "The Let's Work Together form and sending the email", match: /contact/i },
  { key: "services", label: "Services", description: "The Services page and its content from Sanity", match: /\/services\/|services\.test/ },
  { key: "adventure", label: "The Deep Drop game", description: "The story, the choices and the game screen", match: /adventure/ },
  { key: "performance", label: "Performance page", description: "Running PageSpeed tests and showing the report", match: /performance|pagespeed/i },
  { key: "menu", label: "Header, menu & footer", description: "The logo, the ⌘K menu and the footer", match: /header|footer/ },
  { key: "seo", label: "SEO", description: "Sitemap, robots.txt, page titles and descriptions", match: /robots|sitemap|seo\.test/i },
  { key: "fun", label: "Fun mode", description: "The site-wide animations", match: /animation/i },
  { key: "tests", label: "This tests page", description: "Running the tests and building this report", match: /\/tests\/|capture-test-results|testGroups/ },
];

/** Fallback area for tests that don't match any in `TEST_AREAS`. */
export const OTHER_AREA: Omit<TestArea, "match"> = {
  key: "other",
  label: "Everything else",
  description: "Tests that don't belong to one part of the site",
};

/** Tests that share the same top-level test group inside an area. */
export interface TestSection {
  /** The test group ("describe") title, e.g. "Sending the email". */
  title: string;
  tests: TestCaseResult[];
}

/** One area with its tests, pass/fail counts and overall status. */
export interface AreaGroup {
  key: string;
  label: string;
  description: string;
  files: TestFileResult[];
  sections: TestSection[];
  /** Files that crashed before their tests could run. */
  fileErrors: { file: string; error: string }[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  /** Failed if anything failed or crashed; skipped only when nothing passed. */
  status: "passed" | "failed" | "skipped";
}

/** Finds which part of the site a test file belongs to, falling back to `OTHER_AREA`. */
export function areaForFile(file: string): Omit<TestArea, "match"> {
  return TEST_AREAS.find((area) => area.match.test(file)) ?? OTHER_AREA;
}

/** Group test files by part of the site, then by test group title inside each part. */
export function groupByArea(files: TestFileResult[]): AreaGroup[] {
  const byKey = new Map<string, AreaGroup>();

  for (const file of files) {
    const area = areaForFile(file.file);
    let group = byKey.get(area.key);
    if (!group) {
      group = { ...area, files: [], sections: [], fileErrors: [], total: 0, passed: 0, failed: 0, skipped: 0, status: "passed" };
      byKey.set(area.key, group);
    }
    group.files.push(file);
    if (file.error) group.fileErrors.push({ file: file.file, error: file.error });

    for (const test of file.tests) {
      const title = test.ancestors[0] ?? "General";
      let section = group.sections.find((s) => s.title === title);
      if (!section) {
        section = { title, tests: [] };
        group.sections.push(section);
      }
      section.tests.push(test);
      group.total += 1;
      if (test.status === "passed") group.passed += 1;
      else if (test.status === "failed") group.failed += 1;
      else group.skipped += 1;
    }
  }

  const order = [...TEST_AREAS.map((a) => a.key), OTHER_AREA.key];
  return [...byKey.values()]
    .map((group) => ({
      ...group,
      status: group.failed > 0 || group.fileErrors.length > 0 ? "failed" : group.skipped > 0 && group.passed === 0 ? "skipped" : "passed",
    }) as AreaGroup)
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

import { describe, it, expect } from "vitest";
import { normalizePageSpeed, ratingFromScore, splitMarkdown } from "../pagespeed";
import { pageSpeedSample } from "./fixtures/pagespeed-sample";

describe("Reading PageSpeed results", () => {
  const result = normalizePageSpeed(pageSpeedSample, "mobile");

  it("converts category scores to 0–100 in a fixed order", () => {
    expect(result.categories).toEqual([
      { id: "performance", title: "Performance", score: 87 },
      { id: "accessibility", title: "Accessibility", score: 96 },
      { id: "best-practices", title: "Best practices", score: 100 },
      { id: "seo", title: "SEO", score: 45 },
    ]);
  });

  it("extracts the five lab metrics with ratings and clean values", () => {
    expect(result.metrics.map((m) => [m.title, m.displayValue, m.rating])).toEqual([
      ["First Contentful Paint", "1.2 s", "good"],
      ["Largest Contentful Paint", "3.1 s", "average"],
      ["Total Blocking Time", "700 ms", "poor"],
      ["Cumulative Layout Shift", "0.01", "good"],
      ["Speed Index", "1.8 s", "good"],
    ]);
    expect(result.metrics[0].description).not.toContain("](");
  });

  it("reads real-visitor (field) data when Chrome has it", () => {
    expect(result.field?.overall).toBe("average");
    expect(result.field?.metrics.map((m) => [m.title, m.displayValue, m.rating])).toEqual([
      ["Largest Contentful Paint", "2.1 s", "good"],
      ["Interaction to Next Paint", "240 ms", "average"],
      ["Cumulative Layout Shift", "0.03", "good"],
    ]);
  });

  it("handles sites without real-visitor data", () => {
    const noField = { ...pageSpeedSample, loadingExperience: undefined };
    expect(normalizePageSpeed(noField, "desktop").field).toBeNull();
  });

  it("lists failing audits, biggest savings first, skipping metrics, passes and hidden ones", () => {
    expect(result.opportunities.map((o) => o.id)).toEqual([
      "unused-javascript",
      "render-blocking-insight",
      "image-delivery-insight",
    ]);
    const js = result.opportunities[0];
    expect(js.savings).toBe("1.2 s · 88 KiB");
    expect(js.learnMoreUrl).toContain("unused-javascript");
    expect(js.description).toBe("Reduce unused JavaScript and defer loading scripts until they are required.");
  });

  it("keeps the screenshot, version, time and a link to the full report", () => {
    expect(result.screenshot).toMatch(/^data:image\/jpeg/);
    expect(result.lighthouseVersion).toBe("12.8.2");
    expect(result.fetchTime).toBe("2026-09-23T22:00:00.000Z");
    expect(result.reportUrl).toBe("https://pagespeed.web.dev/report?url=https%3A%2F%2Festebanpayret.com%2F&form_factor=mobile");
  });

  it("gives a clear error when there is no Lighthouse result", () => {
    expect(() => normalizePageSpeed({ error: {} }, "mobile")).toThrow(/no Lighthouse result/);
  });
});

describe("Scores and tips", () => {
  it("rates scores using Lighthouse's bands", () => {
    expect([ratingFromScore(0.95), ratingFromScore(0.5), ratingFromScore(0.49), ratingFromScore(null)]).toEqual([
      "good",
      "average",
      "poor",
      "none",
    ]);
  });

  it("strips markdown links but keeps the learn-more URL", () => {
    expect(splitMarkdown("Use `font-display`. [Learn more](https://x.dev/a).")).toEqual({
      text: "Use font-display.",
      link: "https://x.dev/a",
    });
  });
});

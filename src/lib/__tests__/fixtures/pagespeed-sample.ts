/** Trimmed-down PageSpeed Insights v5 response in the shape Lighthouse 12 returns. */
export const pageSpeedSample = {
  id: "https://estebanpayret.com/",
  loadingExperience: {
    id: "https://estebanpayret.com/",
    metrics: {
      LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2100, category: "FAST" },
      INTERACTION_TO_NEXT_PAINT: { percentile: 240, category: "AVERAGE" },
      CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 3, category: "FAST" },
    },
    overall_category: "AVERAGE",
  },
  lighthouseResult: {
    lighthouseVersion: "12.8.2",
    fetchTime: "2026-09-23T22:00:00.000Z",
    finalDisplayedUrl: "https://estebanpayret.com/",
    runWarnings: [],
    categories: {
      performance: {
        score: 0.87,
        auditRefs: [
          { id: "first-contentful-paint", group: "metrics", weight: 10 },
          { id: "largest-contentful-paint", group: "metrics", weight: 25 },
          { id: "total-blocking-time", group: "metrics", weight: 30 },
          { id: "cumulative-layout-shift", group: "metrics", weight: 25 },
          { id: "speed-index", group: "metrics", weight: 10 },
          { id: "render-blocking-insight", group: "insights", weight: 0 },
          { id: "image-delivery-insight", group: "insights", weight: 0 },
          { id: "unused-javascript", group: "diagnostics", weight: 0 },
          { id: "font-display-insight", group: "insights", weight: 0 },
          { id: "network-rtt", group: "hidden", weight: 0 },
        ],
      },
      accessibility: { score: 0.96 },
      "best-practices": { score: 1 },
      seo: { score: 0.45 },
    },
    audits: {
      "first-contentful-paint": { id: "first-contentful-paint", score: 0.95, numericValue: 1200, displayValue: "1.2 s", description: "First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/)." },
      "largest-contentful-paint": { id: "largest-contentful-paint", score: 0.62, numericValue: 3100, displayValue: "3.1 s", description: "LCP marks when the largest text or image is painted." },
      "total-blocking-time": { id: "total-blocking-time", score: 0.3, numericValue: 700, displayValue: "700 ms", description: "Sum of long tasks." },
      "cumulative-layout-shift": { id: "cumulative-layout-shift", score: 1, numericValue: 0.01, displayValue: "0.01", description: "CLS." },
      "speed-index": { id: "speed-index", score: 0.9, numericValue: 1800, displayValue: "1.8 s", description: "Speed Index." },
      "render-blocking-insight": { id: "render-blocking-insight", title: "Render blocking requests", score: 0, scoreDisplayMode: "metricSavings", metricSavings: { FCP: 450, LCP: 450 }, displayValue: "Est savings of 450 ms", description: "Requests are blocking the page's initial render. [Learn more](https://developer.chrome.com/docs/performance/insights/render-blocking)." },
      "image-delivery-insight": { id: "image-delivery-insight", title: "Improve image delivery", score: 0.5, scoreDisplayMode: "metricSavings", metricSavings: { LCP: 150 }, details: { overallSavingsBytes: 51200 }, description: "Reducing the download time of images can improve the perceived load time. [Learn more](https://developer.chrome.com/docs/performance/insights/image-delivery)." },
      "unused-javascript": { id: "unused-javascript", title: "Reduce unused JavaScript", score: 0.5, scoreDisplayMode: "metricSavings", details: { overallSavingsMs: 1200, overallSavingsBytes: 90000 }, description: "Reduce unused JavaScript and defer loading scripts until they are required. [Learn how to reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/)." },
      "font-display-insight": { id: "font-display-insight", title: "Font display", score: 1, scoreDisplayMode: "metricSavings", description: "Fine." },
      "network-rtt": { id: "network-rtt", score: null, scoreDisplayMode: "informative" },
      "final-screenshot": { details: { type: "screenshot", data: "data:image/jpeg;base64,AAAA" } },
    },
  },
};

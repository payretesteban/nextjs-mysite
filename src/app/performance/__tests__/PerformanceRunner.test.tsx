import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PerformanceRunner from "../PerformanceRunner";
import { normalizePageSpeed } from "@/lib/pagespeed";
import { pageSpeedSample } from "@/lib/__tests__/fixtures/pagespeed-sample";

function mockFetch(body: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const response = (strategy: "mobile" | "desktop", cached = false) => ({
  result: normalizePageSpeed(pageSpeedSample, strategy),
  cached,
  freshAfter: "2026-09-23T22:10:00.000Z",
});

describe("PerformanceRunner", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("starts with mobile selected and no report", () => {
    render(<PerformanceRunner url="https://estebanpayret.com/" />);
    expect(screen.getByRole("radio", { name: /mobile/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Core metrics")).not.toBeInTheDocument();
  });

  it("runs the test for the chosen device and shows the report", async () => {
    const fetchMock = mockFetch(response("desktop"));
    render(<PerformanceRunner url="https://estebanpayret.com/" />);

    fireEvent.click(screen.getByRole("radio", { name: /desktop/i }));
    fireEvent.click(screen.getByRole("button", { name: /run performance test/i }));

    expect(await screen.findByText("Core metrics")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/performance", expect.objectContaining({ method: "POST", body: JSON.stringify({ strategy: "desktop" }) }));

    // Scores, metrics, field data and improvements
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("SEO")).toBeInTheDocument();
    expect(screen.getByText("700 ms")).toBeInTheDocument();
    expect(screen.getByText("Interaction to Next Paint")).toBeInTheDocument();
    expect(screen.getByText("Reduce unused JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Save ~1.2 s · 88 KiB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /full report/i })).toHaveAttribute("href", expect.stringContaining("form_factor=desktop"));
    expect(screen.getByRole("button", { name: /run again/i })).toBeInTheDocument();
  });

  it("labels cached results", async () => {
    mockFetch(response("mobile", true));
    render(<PerformanceRunner url="https://estebanpayret.com/" />);
    fireEvent.click(screen.getByRole("button", { name: /run performance test/i }));
    expect(await screen.findByText(/saved result/i)).toBeInTheDocument();
  });

  it("shows the server's error message", async () => {
    mockFetch({ error: "Google's free testing quota is used up for now." }, false, 429);
    render(<PerformanceRunner url="https://estebanpayret.com/" />);
    fireEvent.click(screen.getByRole("button", { name: /run performance test/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/quota is used up/i);
  });
});

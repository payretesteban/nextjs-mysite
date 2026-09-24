import { unstable_cache } from "next/cache";
import { fetchPageSpeed, type PerformanceResponse, type Strategy } from "@/lib/pagespeed";

// A Lighthouse run on Google's servers usually takes 15–40s
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 600; // 10 minutes

/**
 * Runs PageSpeed Insights against the live homepage. Results are cached for up to 10 minutes per
 * device (shared across visitors) so repeat clicks are instant and don't use up the API quota.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const strategy: Strategy = body?.strategy === "desktop" ? "desktop" : "mobile";

  // Fixed 10-minute windows: a result is never older than the window it was produced in
  const bucket = Math.floor(Date.now() / (CACHE_SECONDS * 1000));
  let ranNow = false;

  try {
    const result = await unstable_cache(
      async () => {
        ranNow = true;
        return fetchPageSpeed(strategy);
      },
      ["pagespeed-v1", strategy, String(bucket)],
      { revalidate: CACHE_SECONDS }
    )();

    const payload: PerformanceResponse = {
      result,
      cached: !ranNow,
      freshAfter: new Date((bucket + 1) * CACHE_SECONDS * 1000).toISOString(),
    };
    return Response.json(payload);
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[performance] PageSpeed Insights failed:", detail);

    let message = "The performance test couldn't run right now. Please try again in a minute.";
    if (status === 429) message = "Google's free testing quota is used up for now. Please try again later.";
    else if (error instanceof Error && error.name === "TimeoutError")
      message = "The test took too long to finish. Please try again.";

    // Show the underlying reason while developing (e.g. a missing or invalid API key)
    if (process.env.NODE_ENV === "development") {
      message += `\n\nDetails: ${detail}`;
      if (!process.env.PAGESPEED_API_KEY) message += "\nTip: set PAGESPEED_API_KEY in .env.local.";
    }
    return Response.json({ error: message }, { status: status === 429 ? 429 : 502 });
  }
}

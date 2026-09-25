/**
 * Tiny in-memory rate limiter. Best effort: each server instance keeps its own counts,
 * which is enough to stop someone hammering a button.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    /** Records a hit and returns true when `key` is over the limit. */
    isLimited(key: string, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      const limited = recent.length >= limit;
      if (!limited) recent.push(now);
      hits.set(key, recent);
      if (hits.size > 5000) hits.clear(); // keep memory bounded
      return limited;
    },
    /** Clears all counts (useful in tests). */
    reset() {
      hits.clear();
    },
  };
}

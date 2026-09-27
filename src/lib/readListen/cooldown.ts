/**
 * Remembers that the AI hit its usage limit, so for a while the page skips it and goes straight to the
 * built-in library instead of waiting for Google to say no again. In memory, per server instance.
 */
export function createCooldown({ defaultMs = 10 * 60 * 1000, minMs = 30 * 1000, maxMs = 60 * 60 * 1000 } = {}) {
  let pausedUntil = 0;
  return {
    /** Pauses the AI for Google's suggested time (kept between 30 s and 1 h), or 10 minutes if it gave none. */
    pause(retryAfterMs: number | null, now = Date.now()) {
      const wait = Math.min(Math.max(retryAfterMs ?? defaultMs, minMs), maxMs);
      pausedUntil = Math.max(pausedUntil, now + wait);
    },
    /** True while the pause is still running. */
    isPaused(now = Date.now()) {
      return now < pausedUntil;
    },
    /** Ends the pause (useful in tests). */
    reset() {
      pausedUntil = 0;
    },
  };
}

/** The shared cooldown used by the Read & Listen API route. */
export const aiCooldown = createCooldown();

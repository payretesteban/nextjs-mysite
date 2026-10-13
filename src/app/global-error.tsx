"use client";

/**
 * Last resort when even the root layout fails: a plain page with its own <html> and inline styles
 * (the site's stylesheet may not have loaded), and a button to try again.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#0f172a" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>The site didn&apos;t load</h1>
          <p style={{ color: "#475569", lineHeight: 1.6 }}>Something went wrong on our side. Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#0f172a", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

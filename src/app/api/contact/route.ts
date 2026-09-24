import { contactEmailHtml, contactEmailText, contactSubject, validateContact } from "@/lib/contact";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const TO = process.env.CONTACT_TO_EMAIL ?? "me@estebanpayret.com";
// Until your domain is verified in Resend, onboarding@resend.dev only delivers to your Resend account's email
const FROM = process.env.CONTACT_FROM_EMAIL ?? "Website contact form <onboarding@resend.dev>";

const MIN_FILL_MS = 3000; // nobody fills the form in under 3 seconds — bots do
const RATE_LIMIT = 5; // messages…
const RATE_WINDOW_MS = 60 * 60 * 1000; // …per hour, per visitor

// 5 messages per visitor per hour (see src/lib/rateLimit.ts)
const contactRateLimiter = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  // Spam traps: a hidden field only bots fill in, and a minimum time on the form.
  // Pretend it worked so bots don't learn anything.
  const startedAt = Number(body.startedAt);
  if (body.website || !Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return Response.json({ ok: true });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (contactRateLimiter.isLimited(ip)) {
    return Response.json(
      { error: "You've sent several messages already. Please try again later, or email me directly." },
      { status: 429 }
    );
  }

  const { data, errors } = validateContact(body);
  if (!data) return Response.json({ error: "Please check the highlighted fields.", errors }, { status: 400 });

  const email = {
    from: FROM,
    to: [TO],
    reply_to: data.email,
    subject: contactSubject(data),
    html: contactEmailHtml(data),
    text: contactEmailText(data),
    tags: [{ name: "inquiry", value: data.type }],
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      // Local testing without a key: print the email instead of sending it
      console.log("[contact] RESEND_API_KEY not set — email not sent. Preview:\n", { ...email, html: undefined });
      return Response.json({ ok: true, preview: true });
    }
    console.error("[contact] RESEND_API_KEY is not set");
    return Response.json({ error: "The contact form isn't set up yet. Please email me directly." }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[contact] Resend responded ${res.status}: ${detail.slice(0, 500)}`);
      return Response.json({ error: "Your message couldn't be sent right now. Please try again in a moment." }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[contact] Sending failed:", error);
    return Response.json({ error: "Your message couldn't be sent right now. Please try again in a moment." }, { status: 502 });
  }
}

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { POST } from "../route";

let ipCounter = 0;
const valid = {
  type: "fulltime",
  name: "Sam Lee",
  email: "sam@globex.com",
  company: "Globex",
  role: "Engineering Manager",
  message: "We'd love to talk about an engineering manager role.",
};

function post(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return POST(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: JSON.stringify(body),
    })
  );
}

const human = (extra: object = {}) => ({ ...valid, startedAt: Date.now() - 10_000, website: "", ...extra });

describe("Sending the email", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "inbox@example.com");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends the email through Resend with reply-to set to the visitor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "1" }) });
    vi.stubGlobal("fetch", fetchMock);

    const res = await post(human());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const sent = JSON.parse(init.body);
    expect(sent.reply_to).toBe("sam@globex.com");
    expect(sent.to).toEqual(["inbox@example.com"]);
    expect(sent.subject).toBe("[Full-time] Engineering Manager at Globex — Sam Lee");
    expect(sent.text).toContain("We'd love to talk");
  });

  it("silently drops bots that fill the hidden field or submit too fast", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await (await post(human({ website: "http://spam" }))).json()).toEqual({ ok: true });
    expect(await (await post(human({ startedAt: Date.now() }))).json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const res = await post(human({ email: "not-an-email", role: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(Object.keys(json.errors).sort()).toEqual(["email", "role"]);
  });

  it("limits each visitor to 5 messages an hour", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }));
    for (let i = 0; i < 5; i++) expect((await post(human(), "1.2.3.4")).status).toBe(200);
    expect((await post(human(), "1.2.3.4")).status).toBe(429);
  });

  it("shows a friendly error when Resend fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, text: () => Promise.resolve("bad from") }));
    const res = await post(human());
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/couldn't be sent/);
  });

  it("refuses to pretend it worked in production when no key is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    const res = await post(human());
    expect(res.status).toBe(503);
  });

  it("refuses to send in production when no recipient is configured, instead of guessing one", async () => {
    vi.stubEnv("CONTACT_TO_EMAIL", "");
    vi.stubEnv("NODE_ENV", "production");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await post(human());
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

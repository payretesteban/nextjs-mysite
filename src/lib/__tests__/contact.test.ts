import { describe, it, expect } from "vitest";
import { contactEmailHtml, contactEmailText, contactSubject, validateContact } from "../contact";

const consulting = {
  type: "consulting",
  name: "  Jane Doe ",
  email: "jane@acme.com",
  company: "Acme",
  projectType: "Architecture review",
  budget: "$5k – $15k",
  timeline: "Within a month",
  message: "We need help reviewing our platform architecture.",
};

describe("Checking the form fields", () => {
  it("accepts a valid consulting inquiry and trims values", () => {
    const { data, errors } = validateContact(consulting);
    expect(errors).toEqual({});
    expect(data?.name).toBe("Jane Doe");
    expect(data?.type).toBe("consulting");
  });

  it("requires name, a valid email and a real message", () => {
    const { data, errors } = validateContact({ type: "consulting", name: "", email: "nope", message: "hi" });
    expect(data).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name"]);
  });

  it("requires company and role for full-time, and checks the job link", () => {
    const { errors } = validateContact({ type: "fulltime", name: "Sam", email: "sam@co.io", message: "x".repeat(30), jobUrl: "careers page" });
    expect(Object.keys(errors).sort()).toEqual(["company", "jobUrl", "role"]);
  });

  it("rejects options that aren't in the list and overly long values", () => {
    const { errors } = validateContact({ ...consulting, budget: "a million", message: "x".repeat(5001) });
    expect(errors.budget).toBeDefined();
    expect(errors.message).toMatch(/under 5000/);
  });

  it("ignores unknown types and non-string values", () => {
    const { data } = validateContact({ ...consulting, type: "hack", company: { evil: true } });
    expect(data?.type).toBe("consulting");
    expect(data?.company).toBe("");
  });
});

describe("Writing the email", () => {
  const data = validateContact(consulting).data!;

  it("builds a filterable subject line", () => {
    expect(contactSubject(data)).toBe("[Consulting] Architecture review for Acme — Jane Doe");
    const ft = validateContact({ type: "fulltime", name: "Sam\nBcc: x@y.z", email: "sam@co.io", company: "Globex", role: "EM", message: "x".repeat(30) }).data!;
    expect(contactSubject(ft)).toBe("[Full-time] EM at Globex — Sam Bcc: x@y.z"); // no header injection via newlines
  });

  it("names the service in the subject and email when the form was opened from a service", () => {
    const withTopic = validateContact({ ...consulting, topic: "Web Development" }).data!;
    expect(contactSubject(withTopic)).toBe("[Consulting] Web Development for Acme — Jane Doe");
    expect(contactEmailText(withTopic)).toContain("Service: Web Development");
  });

  it("includes only the fields for the chosen type", () => {
    const text = contactEmailText({ ...data, role: "should not appear" });
    expect(text).toContain("Budget: $5k – $15k");
    expect(text).not.toContain("should not appear");
  });

  it("escapes HTML from visitors", () => {
    const html = contactEmailHtml({ ...data, message: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

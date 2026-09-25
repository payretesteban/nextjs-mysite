/**
 * "Let's work together" form: options, validation (shared by the browser and the server)
 * and the email that gets sent.
 */

/** The two kinds of inquiry the form supports. */
export type InquiryType = "consulting" | "fulltime";

/** Options for the inquiry type switch; `short` is a compact label. */
export const INQUIRY_TYPES: { id: InquiryType; label: string; short: string }[] = [
  { id: "consulting", label: "Consulting & Freelance", short: "Consulting" },
  { id: "fulltime", label: "Full-Time Opportunities", short: "Full-time" },
];

/** Dropdown options for consulting inquiries. */
export const PROJECT_TYPES = [
  "Technical leadership",
  "Architecture review",
  "Team coaching & mentoring",
  "Hands-on development",
  "Something else",
];
export const BUDGETS = ["Under $5k", "$5k – $15k", "$15k – $50k", "$50k+", "Not sure yet"];
export const TIMELINES = ["As soon as possible", "Within a month", "1 – 3 months", "Flexible"];
/** Dropdown options for full-time inquiries. */
export const WORK_SETUPS = ["Remote", "Hybrid", "On-site"];

/** All form fields. Fields that don't apply to the chosen `type` are left empty. */
export interface ContactInput {
  type: InquiryType;
  name: string;
  email: string;
  company: string;
  message: string;
  /** Optional: the service the visitor clicked on, e.g. "Web Development". */
  topic: string;
  // Consulting & Freelance
  projectType: string;
  budget: string;
  timeline: string;
  // Full-time
  role: string;
  workSetup: string;
  location: string;
  jobUrl: string;
}

/** Name of one form field. */
export type ContactField = keyof ContactInput;
/** Error message per field; only fields with a problem are present. */
export type ContactErrors = Partial<Record<ContactField, string>>;

/** A blank form, set to consulting. */
export const EMPTY_CONTACT: ContactInput = {
  type: "consulting",
  name: "",
  email: "",
  company: "",
  message: "",
  topic: "",
  projectType: "",
  budget: "",
  timeline: "",
  role: "",
  workSetup: "",
  location: "",
  jobUrl: "",
};

/** Maximum length per field, to keep emails reasonable and stop abuse. */
const LIMITS: Partial<Record<ContactField, number>> = {
  name: 100,
  email: 200,
  company: 120,
  role: 120,
  location: 120,
  jobUrl: 500,
  topic: 120,
  message: 5000,
};

/** Simple email check: something@domain.tld. Deliberately loose. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validate and clean up the form. Returns the cleaned data or per-field errors. */
export function validateContact(raw: unknown): { data: ContactInput | null; errors: ContactErrors } {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const data = { ...EMPTY_CONTACT };
  for (const key of Object.keys(EMPTY_CONTACT) as ContactField[]) {
    const v = src[key];
    (data as Record<string, string>)[key] = typeof v === "string" ? v.trim() : "";
  }
  data.type = src.type === "fulltime" ? "fulltime" : "consulting";

  const errors: ContactErrors = {};
  if (!data.name) errors.name = "Please enter your name.";
  if (!data.email) errors.email = "Please enter your email.";
  else if (!EMAIL_RE.test(data.email)) errors.email = "That email doesn't look right.";
  if (data.message.length < 20) errors.message = "Please write at least a couple of sentences (20+ characters).";

  if (data.type === "consulting") {
    if (data.projectType && !PROJECT_TYPES.includes(data.projectType)) errors.projectType = "Please pick an option.";
    if (data.budget && !BUDGETS.includes(data.budget)) errors.budget = "Please pick an option.";
    if (data.timeline && !TIMELINES.includes(data.timeline)) errors.timeline = "Please pick an option.";
  } else {
    if (!data.company) errors.company = "Please enter the company name.";
    if (!data.role) errors.role = "Please enter the role title.";
    if (data.workSetup && !WORK_SETUPS.includes(data.workSetup)) errors.workSetup = "Please pick an option.";
    if (data.jobUrl && !/^https?:\/\/\S+\.\S+/i.test(data.jobUrl)) errors.jobUrl = "Please enter a full link starting with https://";
  }

  for (const [key, max] of Object.entries(LIMITS) as [ContactField, number][]) {
    if (!errors[key] && data[key].length > max) errors[key] = `Please keep this under ${max} characters.`;
  }

  return Object.keys(errors).length ? { data: null, errors } : { data, errors };
}

/* ---------------------------------------------------------------- */
/* Email                                                             */
/* ---------------------------------------------------------------- */

/** Escapes text for safe use in HTML, including attribute values. */
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** One line, no line breaks — safe for an email subject header. */
function oneLine(s: string) {
  return s.replace(/[\r\n]+/g, " ").trim();
}

/** Email subject, e.g. "[Consulting] Web Development for Acme — Jane Doe". Max 200 characters. */
export function contactSubject(d: ContactInput) {
  const tag = d.type === "consulting" ? "[Consulting]" : "[Full-time]";
  const topic =
    d.type === "consulting"
      ? [d.topic || d.projectType, d.company].filter(Boolean).join(" for ")
      : [d.role, d.company].filter(Boolean).join(" at ");
  return oneLine(`${tag} ${topic ? `${topic} — ` : ""}${d.name}`).slice(0, 200);
}

/** Label/value pairs for the email summary, skipping empty fields and ones that don't apply to the type. */
function contactRows(d: ContactInput): [string, string][] {
  const rows: [string, string][] = [
    ["Type", d.type === "consulting" ? "Consulting & Freelance" : "Full-Time Opportunity"],
    ["Service", d.topic],
    ["Name", d.name],
    ["Email", d.email],
    ["Company", d.company],
  ];
  if (d.type === "consulting") {
    rows.push(["Project type", d.projectType], ["Budget", d.budget], ["Timeline", d.timeline]);
  } else {
    rows.push(["Role", d.role], ["Work setup", d.workSetup], ["Location", d.location], ["Job posting", d.jobUrl]);
  }
  return rows.filter(([, v]) => v);
}

/** Plain-text email body: the summary rows, then the message. */
export function contactEmailText(d: ContactInput) {
  return [...contactRows(d).map(([k, v]) => `${k}: ${v}`), "", d.message, "", "— Sent from the contact form on estebanpayret.com"].join("\n");
}

/** HTML email body with inline styles (email clients ignore stylesheets). All user input is escaped. */
export function contactEmailHtml(d: ContactInput) {
  const rows = contactRows(d)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#64748b;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0;color:#0f172a">${
          k === "Job posting" ? `<a href="${escapeHtml(v)}">${escapeHtml(v)}</a>` : escapeHtml(v)
        }</td></tr>`
    )
    .join("");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.5;max-width:600px">
<h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">New ${d.type === "consulting" ? "consulting inquiry" : "full-time opportunity"}</h2>
<table style="border-collapse:collapse;margin-bottom:16px">${rows}</table>
<div style="white-space:pre-wrap;color:#0f172a;border-left:3px solid #e2e8f0;padding-left:12px">${escapeHtml(d.message)}</div>
<p style="margin-top:24px;font-size:12px;color:#94a3b8">Reply to this email to answer ${escapeHtml(d.name)} directly.</p>
</div>`;
}

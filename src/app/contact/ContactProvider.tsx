"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BUDGETS,
  EMPTY_CONTACT,
  INQUIRY_TYPES,
  PROJECT_TYPES,
  TIMELINES,
  WORK_SETUPS,
  validateContact,
  type ContactErrors,
  type ContactField,
  type ContactInput,
  type InquiryType,
} from "@/lib/contact";

type ContactContextValue = { open: (type?: InquiryType) => void };
const ContactContext = createContext<ContactContextValue | null>(null);

/** Opens the "Let's work together" form from anywhere. Null outside the provider. */
export function useContact() {
  return useContext(ContactContext);
}

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<ContactInput>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const open = useCallback(
    (type?: InquiryType) => {
      // Start fresh after a successful send; otherwise keep the draft
      if (status === "sent") {
        setForm({ ...EMPTY_CONTACT, type: type ?? "consulting" });
        setStatus("idle");
      } else if (type) {
        setForm((f) => ({ ...f, type }));
      }
      setErrors({});
      setServerError(null);
      startedAtRef.current = Date.now();
      setIsOpen(true);
    },
    [status]
  );

  const close = useCallback(() => setIsOpen(false), []);

  // Drive the native <dialog> (focus trap, Esc, backdrop)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      document.documentElement.style.overflow = "hidden";
      requestAnimationFrame(() => {
        if (!window.matchMedia?.("(pointer: coarse)").matches) {
          formRef.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus();
        }
      });
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    if (!isOpen) document.documentElement.style.overflow = "";
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setIsOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  function update(field: ContactField, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
  }

  function focusFirstError(errs: ContactErrors) {
    const first = Object.keys(errs)[0];
    if (first) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const { data, errors: errs } = validateContact(form);
    if (!data) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, website: honeypot, startedAt: startedAtRef.current }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setStatus("sent");
        return;
      }
      if (json?.errors) {
        setErrors(json.errors);
        focusFirstError(json.errors);
      }
      setServerError(json?.error ?? "Your message couldn't be sent right now. Please try again in a moment.");
      setStatus("error");
    } catch {
      setServerError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  const value = useMemo(() => ({ open }), [open]);
  const sending = status === "sending";
  const firstName = form.name.split(/\s+/)[0];

  return (
    <ContactContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="contact-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl outline-none backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm open:animate-fade-up dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="relative p-6 sm:p-7">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>

          {status === "sent" ? (
            <div className="py-6 text-center" role="status">
              <div className="animate-fade-up mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              </div>
              <h2 id="contact-title" className="mt-5 text-2xl font-bold">
                Thanks{firstName ? `, ${firstName}` : ""}!
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-slate-600 dark:text-slate-400">
                Your message is on its way. I&apos;ll reply to <span className="font-medium text-slate-900 dark:text-slate-100">{form.email}</span> within 2 business days.
              </p>
              <button type="button" onClick={close} className="mt-6 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                Close
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate>
              <h2 id="contact-title" className="pr-8 text-2xl font-bold">
                Let&apos;s work together
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Tell me a bit about what you have in mind and I&apos;ll get back to you within 2 business days.
              </p>

              <div role="radiogroup" aria-label="What are you looking for?" className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800">
                {INQUIRY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={form.type === t.id}
                    onClick={() => update("type", t.id)}
                    className={`rounded-lg px-3 py-2 font-medium transition-all ${
                      form.type === t.id
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Name" name="name" error={errors.name}>
                  <input name="name" autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass(errors.name)} {...a11y("name", errors)} />
                </Field>
                <Field label="Email" name="email" error={errors.email}>
                  <input name="email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass(errors.email)} {...a11y("email", errors)} />
                </Field>

                {form.type === "consulting" ? (
                  <>
                    <Field label="Company" name="company" optional error={errors.company}>
                      <input name="company" autoComplete="organization" value={form.company} onChange={(e) => update("company", e.target.value)} className={inputClass(errors.company)} {...a11y("company", errors)} />
                    </Field>
                    <Field label="Project type" name="projectType" optional error={errors.projectType}>
                      <Select name="projectType" value={form.projectType} options={PROJECT_TYPES} onChange={(v) => update("projectType", v)} error={errors.projectType} errors={errors} />
                    </Field>
                    <Field label="Budget" name="budget" optional error={errors.budget}>
                      <Select name="budget" value={form.budget} options={BUDGETS} onChange={(v) => update("budget", v)} error={errors.budget} errors={errors} />
                    </Field>
                    <Field label="Timeline" name="timeline" optional error={errors.timeline}>
                      <Select name="timeline" value={form.timeline} options={TIMELINES} onChange={(v) => update("timeline", v)} error={errors.timeline} errors={errors} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Company" name="company" error={errors.company}>
                      <input name="company" autoComplete="organization" value={form.company} onChange={(e) => update("company", e.target.value)} className={inputClass(errors.company)} {...a11y("company", errors)} />
                    </Field>
                    <Field label="Role title" name="role" error={errors.role}>
                      <input name="role" placeholder="Engineering Manager" value={form.role} onChange={(e) => update("role", e.target.value)} className={inputClass(errors.role)} {...a11y("role", errors)} />
                    </Field>
                    <Field label="Work setup" name="workSetup" optional error={errors.workSetup}>
                      <Select name="workSetup" value={form.workSetup} options={WORK_SETUPS} onChange={(v) => update("workSetup", v)} error={errors.workSetup} errors={errors} />
                    </Field>
                    <Field label="Location" name="location" optional error={errors.location}>
                      <input name="location" placeholder="City or time zone" value={form.location} onChange={(e) => update("location", e.target.value)} className={inputClass(errors.location)} {...a11y("location", errors)} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Job posting link" name="jobUrl" optional error={errors.jobUrl}>
                        <input name="jobUrl" type="url" inputMode="url" placeholder="https://" value={form.jobUrl} onChange={(e) => update("jobUrl", e.target.value)} className={inputClass(errors.jobUrl)} {...a11y("jobUrl", errors)} />
                      </Field>
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <Field label="Message" name="message" error={errors.message}>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder={form.type === "consulting" ? "What are you working on, and where could I help?" : "Tell me about the team and the role."}
                      value={form.message}
                      onChange={(e) => update("message", e.target.value)}
                      className={`${inputClass(errors.message)} resize-y`}
                      {...a11y("message", errors)}
                    />
                  </Field>
                </div>
              </div>

              {/* Spam trap: invisible to people, bots tend to fill it in */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                </label>
              </div>

              {serverError && (
                <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-80 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {sending ? (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                  </svg>
                )}
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </ContactContext.Provider>
  );
}

/* ---------------------------------------------------------------- */

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
    error
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-800 dark:focus:ring-rose-950"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100 dark:border-slate-700 dark:focus:border-slate-500 dark:focus:ring-slate-800"
  }`;
}

function a11y(name: ContactField, errors: ContactErrors) {
  return {
    id: `contact-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  };
}

function Field({
  label,
  name,
  optional,
  error,
  children,
}: {
  label: string;
  name: ContactField;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`contact-${name}`} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {optional && <span className="text-xs font-normal text-slate-400">Optional</span>}
      </label>
      {children}
      {error && (
        <p id={`contact-${name}-error`} className="mt-1 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

function Select({
  name,
  value,
  options,
  onChange,
  error,
  errors,
}: {
  name: ContactField;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string;
  errors: ContactErrors;
}) {
  return (
    <select name={name} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass(error)} ${value ? "" : "text-slate-400"}`} {...a11y(name, errors)}>
      <option value="">Choose…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

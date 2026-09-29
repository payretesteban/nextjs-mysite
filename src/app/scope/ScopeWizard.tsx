"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  NOTES_MAX,
  QUESTIONS,
  decodeAnswers,
  encodeAnswers,
  labelOf,
  parseAnswers,
  KINDS,
  STAGES,
  USERS_PHRASE,
  type ScopeAnswers,
} from "@/lib/scope/options";
import { SIZE_WORDS, bookingNotes, estimate, fitText, templateSummary, type Estimate, type Size } from "@/lib/scope/estimate";
import BookButton from "../consultation/BookButton";

/** Answers while the wizard is being filled in. */
type Draft = Partial<ScopeAnswers> & { features: ScopeAnswers["features"] };

/** Screens: the intro, one per question, the optional note, then the snapshot. */
const INTRO = -1;
const RESULT = QUESTIONS.length + 1;

/** State of the summary paragraph. */
interface Summary {
  text: string;
  source: "ai" | "template";
  loading: boolean;
}

const chipBase =
  "flex w-full items-start gap-2 rounded-xl border-[1.5px] px-3.5 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const chipOff = "border-slate-300 bg-white text-slate-800 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const chipOn = "border-sky-700 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-950 dark:text-sky-100";

/**
 * The Project Scoping Assistant: seven quick questions (one per screen), an optional note, then a
 * snapshot with size, weeks, phases, what moves the estimate, risks, approach and first steps, plus a
 * short AI-written summary. Answers live only in this page (and in the link, without the note), so a
 * snapshot can be shared or reopened.
 *
 * @param props.bookingUrl - Booking link for the "Book a Free Consultation" button.
 * @param props.bookLabel - Label of that button.
 */
export default function ScopeWizard({ bookingUrl, bookLabel }: { bookingUrl?: string | null; bookLabel: string }) {
  const [step, setStep] = useState(INTRO);
  const [draft, setDraft] = useState<Draft>({ features: [] });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const request = useRef(0);

  const answers = useMemo(() => (step === RESULT ? parseAnswers({ ...draft, budget: draft.budget ?? "skip" }) : null), [draft, step]);
  const result = useMemo(() => (answers ? estimate(answers) : null), [answers]);

  /**
   * Shows the snapshot for the given answers: puts them in the link (so it can be shared) and asks for
   * the AI summary, showing the template summary meanwhile.
   */
  function openResult(d: Draft) {
    const a = parseAnswers({ ...d, budget: d.budget ?? "skip" });
    setDraft(d);
    setStep(RESULT);
    if (!a) return;
    window.history.replaceState(null, "", `#${encodeAnswers(a)}`);
    const id = ++request.current;
    setSummary({ text: templateSummary(a, estimate(a)), source: "template", loading: true });
    fetch("/api/scope-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { summary?: string; source?: "ai" | "template" } | null) => {
        if (id !== request.current) return;
        setSummary((prev) => ({ text: data?.summary || prev?.text || "", source: data?.source === "ai" ? "ai" : "template", loading: false }));
      })
      .catch(() => {
        if (id === request.current) setSummary((prev) => (prev ? { ...prev, loading: false } : prev));
      });
  }

  // Open a shared snapshot straight away (the link holds every answer except the note)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const shared = decodeAnswers(window.location.hash);
      if (shared) openResult(shared);
    });
    return () => cancelAnimationFrame(frame);
    // Only on first load
  }, []);

  // Move focus to each new screen's heading, so keyboard and screen reader users follow along
  useEffect(() => {
    if (step !== INTRO) headingRef.current?.focus();
  }, [step]);


  /** Sets a single-choice answer and moves to the next screen. */
  function choose(key: keyof ScopeAnswers, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (step + 1 === RESULT) openResult(next);
    else setStep(step + 1);
  }

  /** Adds or removes one capability. */
  function toggleFeature(value: ScopeAnswers["features"][number]) {
    setDraft((d) => ({ ...d, features: d.features.includes(value) ? d.features.filter((f) => f !== value) : [...d.features, value] }));
  }

  /** Clears everything and goes back to the first question. */
  function restart() {
    setDraft({ features: [] });
    setSummary(null);
    request.current++;
    window.history.replaceState(null, "", window.location.pathname);
    setStep(0);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the address bar still has the link
    }
  }

  if (step === INTRO) {
    return (
      <div className="rounded-3xl border border-slate-200 p-6 sm:p-8 dark:border-slate-800">
        <p className="text-lg text-slate-700 dark:text-slate-300">
          Answer seven quick questions and get a rough size, timeline, phases and the main risks for your project.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
          <li>⏱ About 2 minutes</li>
          <li>🔒 No sign-up and no email: your answers stay in your browser</li>
          <li>📐 A rough estimate to start a conversation, not a quote</li>
        </ul>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-reduce:hover:translate-y-0 dark:bg-white dark:text-slate-900"
        >
          Start
          <Arrow />
        </button>
      </div>
    );
  }

  if (step < RESULT) {
    const question = QUESTIONS[step];
    const total = QUESTIONS.length + 1;
    const progress = Math.round(((step + 1) / total) * 100);
    return (
      <div className="rounded-3xl border border-slate-200 p-6 sm:p-8 dark:border-slate-800">
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>
            Step {step + 1} of {total}
          </span>
          <span>{total - step - 1 > 0 ? `${total - step - 1} to go` : "Last one"}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-label="Progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-sky-700 transition-[width] dark:bg-sky-400" style={{ width: `${progress}%` }} />
        </div>

        {question ? (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="mt-6 text-xl font-bold outline-none">
              {question.title}
            </h2>
            {question.help && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{question.help}</p>}
            <div
              role={question.multiple ? "group" : "radiogroup"}
              aria-label={question.title}
              className="mt-4 grid gap-2 sm:grid-cols-2"
            >
              {question.choices.map((choice) => {
                const selected = question.multiple
                  ? draft.features.includes(choice.id as ScopeAnswers["features"][number])
                  : draft[question.key] === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    role={question.multiple ? "checkbox" : "radio"}
                    aria-checked={selected}
                    onClick={() =>
                      question.multiple ? toggleFeature(choice.id as ScopeAnswers["features"][number]) : choose(question.key, choice.id)
                    }
                    className={`${chipBase} ${selected ? chipOn : chipOff}`}
                  >
                    {question.multiple && (
                      <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-sky-700 bg-sky-700 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-900" : "border-slate-400"}`}>
                        {selected && "✓"}
                      </span>
                    )}
                    <span>
                      {choice.label}
                      {choice.hint && <span className="block text-xs font-normal text-slate-600 dark:text-slate-400">{choice.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="mt-6 text-xl font-bold outline-none">
              Anything else I should know?
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Optional. A sentence or two about the problem you&apos;re solving.</p>
            <label className="mt-4 block">
              <span className="sr-only">Anything else I should know?</span>
              <textarea
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value.slice(0, NOTES_MAX) }))}
                rows={4}
                maxLength={NOTES_MAX}
                placeholder="e.g. We book appointments by phone today and want customers to do it online."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900"
              />
              <span className="mt-1 block text-right text-xs text-slate-600 dark:text-slate-400">
                {(draft.notes ?? "").length}/{NOTES_MAX}
              </span>
            </label>
          </>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Back
          </button>
          {(question?.multiple || question?.optional || !question) && (
            <button
              type="button"
              onClick={() => (step + 1 === RESULT ? openResult(draft) : setStep(step + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-slate-900"
            >
              {!question ? "See my snapshot" : question.optional && !draft[question.key] ? "Skip" : "Next"}
              <Arrow />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!answers || !result) {
    // Only reachable with a broken draft: start again
    return (
      <p>
        Something&apos;s missing.{" "}
        <button type="button" onClick={restart} className="font-semibold text-sky-800 underline dark:text-sky-300">
          Start over
        </button>
      </p>
    );
  }

  return (
    <Snapshot
      answers={answers}
      result={result}
      summary={summary}
      headingRef={headingRef}
      bookingUrl={bookingUrl}
      bookLabel={bookLabel}
      copied={copied}
      onCopy={copyLink}
      onRestart={restart}
    />
  );
}

/** Small "→" icon for buttons. */
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const SIZES: Size[] = ["S", "M", "L", "XL"];
const FIT_STYLE = {
  fits: "text-emerald-700 dark:text-emerald-400",
  flexible: "text-slate-600 dark:text-slate-400",
  tight: "text-amber-700 dark:text-amber-400",
  over: "text-rose-700 dark:text-rose-400",
};

/** The result report: summary, size, weeks, phases, what moves the estimate, risks, approach and actions. */
function Snapshot({
  answers,
  result,
  summary,
  headingRef,
  bookingUrl,
  bookLabel,
  copied,
  onCopy,
  onRestart,
}: {
  answers: ScopeAnswers;
  result: Estimate;
  summary: Summary | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  bookingUrl?: string | null;
  bookLabel: string;
  copied: boolean;
  onCopy: () => void;
  onRestart: () => void;
}) {
  // Phase bars follow each other on one timeline, each as long as its typical (middle) length
  const mids = result.phases.map((p) => (p.min + p.max) / 2);
  const span = mids.reduce((a, b) => a + b, 0);
  const ghost =
    "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <article className="rounded-3xl border border-slate-200 p-6 sm:p-8 print:border-0 print:p-0 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
            Your project snapshot
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {labelOf(KINDS, answers.kind)} · {labelOf(STAGES, answers.stage).toLowerCase()} · {USERS_PHRASE[answers.scale]}
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold tracking-wide text-amber-900 uppercase dark:bg-amber-950 dark:text-amber-200">
          Rough estimate
        </span>
      </div>

      {/* Summary: written by AI when available, otherwise from a template */}
      <div aria-live="polite" aria-busy={summary?.loading} className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
        <p className={`leading-relaxed text-slate-800 transition-opacity dark:text-slate-200 ${summary?.loading ? "opacity-60" : ""}`}>{summary?.text}</p>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          {summary?.loading ? "Writing a personal summary…" : summary?.source === "ai" ? "✦ Summary written by AI from the estimate below" : "Summary from the estimate below"}
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="size-heading">
          <h3 id="size-heading" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
            Size and effort
          </h3>
          <div className="mt-2 flex gap-1" aria-label={`Size: ${SIZE_WORDS[result.size]}`} role="img">
            {SIZES.map((s) => (
              <span
                key={s}
                className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold ${s === result.size ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-3 text-lg">
            <b>
              {result.min}–{result.max} weeks
            </b>{" "}
            <span className="text-sm text-slate-600 dark:text-slate-400">with one senior developer</span>
          </p>
          <p className={`text-sm font-medium ${FIT_STYLE[result.fit]}`}>{fitText(result.fit, answers.timeline)}</p>
          {result.deferrable.length > 0 && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Could wait for a second release: {result.deferrable.join(", ")}.</p>
          )}

          <h3 className="mt-5 text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">Phases</h3>
          <ol className="mt-2 space-y-2">
            {result.phases.map((phase, i) => {
              const left = (mids.slice(0, i).reduce((a, b) => a + b, 0) / span) * 100;
              const width = (mids[i] / span) * 100;
              return (
                <li key={phase.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-sm">
                  <span>{phase.name}</span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                    {phase.min === phase.max ? phase.min : `${phase.min}–${phase.max}`} wk
                  </span>
                  <span aria-hidden="true" className="relative col-span-2 mt-1 h-2 rounded bg-slate-100 dark:bg-slate-800">
                    <span
                      className={`absolute inset-y-0 rounded ${["bg-sky-300", "bg-sky-700", "bg-emerald-500"][i]}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="moves-heading" className="rounded-2xl bg-slate-900 p-4 text-white dark:bg-slate-800">
          <h3 id="moves-heading" className="font-mono text-[11px] font-semibold tracking-widest text-sky-300 uppercase">
            What moves the estimate
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {result.factors.map((f) => (
              <li key={f.label} className="flex justify-between gap-3">
                <span className="text-slate-200">{f.label}</span>
                <span className={`shrink-0 font-mono ${f.weeks < 0 ? "text-emerald-300" : "text-white"}`}>
                  {f.weeks > 0 ? "+" : "−"}
                  {Math.abs(f.weeks)} wk
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-slate-700 pt-2 text-xs text-slate-300">
            Total with a range of −20% / +30% for the unknowns.
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="risks-heading">
          <h3 id="risks-heading" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
            Risks to plan for
          </h3>
          <ul className="mt-2 space-y-2 text-sm">
            {result.risks.map((r) => (
              <li key={r.title} className="flex gap-2">
                <span aria-hidden="true" className="text-amber-600">
                  ⚠
                </span>
                <span>
                  <b>{r.title}:</b> {r.advice}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="first-heading">
          <h3 id="first-heading" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
            What I&apos;d do first
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {result.firstSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="approach-heading" className="mt-6">
        <h3 id="approach-heading" className="text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
          Suggested approach
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {result.approach.map((a) => (
            <li key={a} className="flex gap-2">
              <span aria-hidden="true" className="text-sky-700 dark:text-sky-400">
                ›
              </span>
              {a}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs text-slate-600 dark:text-slate-400">
        A rough estimate from your answers, not a quote. Every project is different: the free consultation is where we get specific.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
        <BookButton bookingUrl={bookingUrl} label={bookLabel} notes={bookingNotes(answers, result)} />
        <button type="button" onClick={onCopy} className={ghost}>
          {copied ? "Link copied ✓" : "Copy link"}
        </button>
        <button type="button" onClick={() => window.print()} className={ghost}>
          Save as PDF
        </button>
        <button type="button" onClick={onRestart} className={ghost}>
          Start over
        </button>
      </div>
    </article>
  );
}

"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  LANGUAGES,
  LEVELS,
  TOPICS,
  languageOf,
  nextLevel,
  type LangCode,
  type Level,
  type ReadListenText,
  type TopicId,
} from "@/lib/readListen/options";
import { pickOtherVoice, pickVoice } from "@/lib/readListen/speech";

type TopicChoice = TopicId | "surprise";

/** Which sentence is being read aloud right now. */
interface Speaking {
  lang: LangCode;
  /** Sentence being read, or -1 while the voice is still starting up. */
  index: number;
}

/**
 * Reading speeds, slowest first, with a pause between sentences so learners can follow (longer at
 * slower speeds; none at normal speed).
 */
const SPEEDS = [
  { rate: 0.5, label: "Very slow", pauseMs: 2000 },
  { rate: 0.75, label: "Slow", pauseMs: 1000 },
  { rate: 1, label: "Normal", pauseMs: 0 },
] as const;
type Speed = (typeof SPEEDS)[number];
const NO_VOICES: SpeechSynthesisVoice[] = [];
let voiceCache: SpeechSynthesisVoice[] = NO_VOICES;

/** Subscribes to the browser's voice list, which often loads a moment after the page. */
function subscribeVoices(onChange: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener("voiceschanged", onChange);
  return () => synth.removeEventListener("voiceschanged", onChange);
}

/** Current voices; returns the same array until the list actually changes (required by useSyncExternalStore). */
function getVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return NO_VOICES;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length !== voiceCache.length) voiceCache = voices;
  return voiceCache;
}

/** True when the browser can speak at all (assumed on the server so the markup matches). */
const speechSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * The interactive part of the Read & Listen page: language, level and topic settings, the two
 * side-by-side texts with play buttons, sentence highlighting and "Try it harder".
 * @param props.initial - Text shown before the visitor asks for a new one (from the built-in library).
 */
export default function ReadListen({ initial }: { initial: ReadListenText }) {
  const [learn, setLearn] = useState<LangCode>("es");
  const [know, setKnow] = useState<LangCode>("en");
  const [level, setLevel] = useState<Level>(initial.level);
  const [topic, setTopic] = useState<TopicChoice>(initial.topic);
  const [text, setText] = useState<ReadListenText>(initial);
  const [variant, setVariant] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState<Speaking | null>(null);
  const [speed, setSpeed] = useState<Speed>(SPEEDS[2]);
  const requestId = useRef(0);
  // Current reading: a run number (so late events from a stopped reading are ignored) and the
  // utterances themselves (kept referenced, or Chrome may garbage-collect them and never finish)
  const playRun = useRef(0);
  const queue = useRef<SpeechSynthesisUtterance[]>([]);

  const voices = useSyncExternalStore(subscribeVoices, getVoices, () => NO_VOICES);
  const supported = useSyncExternalStore(subscribeVoices, speechSupported, () => true);

  // Stop any speech when leaving the page
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  // Load the "I'm learning" voice ahead of time with a silent utterance, so the first play is quick:
  // browsers load a voice the first time it's used, which can take a few seconds for some languages
  const warmVoice = voices.length ? pickVoice(voices, languageOf(learn).tag) : null;
  useEffect(() => {
    if (!warmVoice || !speechSupported() || window.speechSynthesis.speaking) return;
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.voice = warmVoice;
    utterance.lang = warmVoice.lang;
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
  }, [warmVoice]);

  /** Stops reading aloud. */
  function stop() {
    playRun.current++; // ignore callbacks from the reading that's being stopped
    queue.current = [];
    if (speechSupported()) window.speechSynthesis.cancel();
    setSpeaking(null);
  }

  /**
   * Reads sentences aloud in one language, one utterance per sentence so the current one can be
   * highlighted. Pass `only` to read a single sentence. Sentences are spoken one after another (the next
   * starts when the previous ends) rather than queued all at once, which keeps browsers from dropping
   * the rest of the text when the voice changes between speakers.
   */
  function speak(lang: LangCode, only?: number) {
    const voice = pickVoice(voices, languageOf(lang).tag);
    const sentences = text.sentences[lang] ?? [];
    if (!speechSupported() || !voice || !sentences.length) return;
    stop();
    const run = playRun.current;
    // Show the stop button straight away: some voices take a moment to start, and a second click on
    // "play" would restart (and delay) the reading
    setSpeaking({ lang, index: -1 });
    // In a conversation the second person gets another voice, or the same voice at a lower pitch
    const otherVoice = text.speakers ? pickOtherVoice(voices, languageOf(lang).tag, voice) : null;
    const indexes = only === undefined ? sentences.map((_, i) => i) : [only];

    queue.current = indexes.map((index) => {
      const secondSpeaker = Boolean(text.speakers) && index % 2 === 1;
      const lineVoice = secondSpeaker && otherVoice ? otherVoice : voice;
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.voice = lineVoice;
      utterance.lang = lineVoice.lang;
      utterance.rate = speed.rate;
      if (text.speakers) utterance.pitch = secondSpeaker && !otherVoice ? 0.8 : secondSpeaker ? 1 : 1.1;
      return utterance;
    });

    /** Speaks item `n` of the queue, then moves on to the next when it finishes. */
    const play = (n: number) => {
      const utterance = queue.current[n];
      if (run !== playRun.current || !utterance) return;
      const next = () => {
        if (run !== playRun.current) return;
        if (n + 1 >= queue.current.length) setSpeaking(null);
        else if (speed.pauseMs) setTimeout(() => play(n + 1), speed.pauseMs);
        else play(n + 1);
      };
      utterance.onstart = () => run === playRun.current && setSpeaking({ lang, index: indexes[n] });
      utterance.onend = next;
      // "interrupted"/"canceled" just mean we stopped it; for real failures skip to the next sentence
      utterance.onerror = (event) => {
        if (event.error !== "interrupted" && event.error !== "canceled") next();
      };
      window.speechSynthesis.speak(utterance);
    };
    // A short pause after cancel(): Chrome sometimes ignores speak() called in the same moment
    setTimeout(() => play(0), 50);
  }

  /** Fetches a new text for the given settings; keeps the current one if the request fails. */
  async function load(settings: { learn: LangCode; know: LangCode; level: Level; topic: TopicChoice; variant: number }) {
    stop();
    setError(null);
    setLoading(true);
    const id = ++requestId.current;
    const others = TOPICS.filter((t) => t.id !== text.topic);
    const resolvedTopic =
      settings.topic === "surprise" ? others[Math.floor(Math.random() * others.length)].id : settings.topic;
    try {
      const res = await fetch("/api/read-listen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, topic: resolvedTopic }),
      });
      const data = await res.json();
      if (id !== requestId.current) return; // a newer request has started
      if (!res.ok) setError(data?.error ?? "Couldn't get a new text. Please try again.");
      else setText(data as ReadListenText);
    } catch {
      if (id === requestId.current) setError("Couldn't get a new text. Please check your connection and try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  /** Changes a setting and loads a matching text (variation 0, so popular combinations are cached). */
  function change(patch: Partial<{ learn: LangCode; know: LangCode; level: Level; topic: TopicChoice }>) {
    const next = { learn, know, level, topic, ...patch };
    // Picking the same language on both sides swaps them instead
    if (patch.learn && patch.learn === know) next.know = learn;
    if (patch.know && patch.know === learn) next.learn = know;
    setLearn(next.learn);
    setKnow(next.know);
    setLevel(next.level);
    setTopic(next.topic);
    setVariant(0);
    load({ ...next, variant: 0 });
  }

  /** Swaps the two languages; both are already loaded, so no request is needed. */
  function swap() {
    stop();
    setLearn(know);
    setKnow(learn);
  }

  /** Asks for a different text with the same settings. */
  function newText() {
    const v = variant + 1;
    setVariant(v);
    load({ learn, know, level, topic, variant: v });
  }

  const harder = nextLevel(level);
  const topicLabel = TOPICS.find((t) => t.id === text.topic)?.label ?? text.topic;
  const selectClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div>
      {/* Settings */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 dark:bg-slate-900/50 dark:ring-slate-800">
        <div className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            I&apos;m learning
            <select className={selectClass} value={learn} onChange={(e) => change({ learn: e.target.value as LangCode })}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={swap}
            aria-label="Swap languages"
            title="Swap languages"
            className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M7 7h13l-4-4M17 17H4l4 4" />
            </svg>
          </button>
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            I speak
            <select className={selectClass} value={know} onChange={(e) => change({ know: e.target.value as LangCode })}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <span id="level-label" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Level
          </span>
          <div role="radiogroup" aria-labelledby="level-label" className="flex rounded-lg bg-white p-0.5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={level === l.id}
                title={l.label}
                onClick={() => change({ level: l.id })}
                className={`rounded-md px-2.5 py-1.5 font-mono text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  level === l.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {l.id}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
          Topic
          <select className={selectClass} value={topic} onChange={(e) => change({ topic: e.target.value as TopicChoice })}>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
            <option value="surprise">Surprise me</option>
          </select>
        </label>

        <button
          type="button"
          onClick={newText}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-900"
        >
          <span aria-hidden="true">✦</span>
          {loading ? "Writing…" : "New text"}
        </button>
      </div>

      {/* The whole page is still a test version: say so for every topic */}
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
        <span className="mr-1.5 rounded-full bg-violet-100 px-2 py-0.5 font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-950 dark:text-violet-300">
          Beta
        </span>
        Read &amp; Listen is a test version. New texts are generated by AI and voices come from your device, so on some systems and
        languages the voice can take a few seconds to start.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {text.notice && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900"
        >
          {text.notice === "ai-paused"
            ? "The AI writer is taking a break (its free usage limit was reached), so here's a text from the built-in library. New AI texts will be back soon."
            : "The AI writer couldn't be reached just now, so here's a text from the built-in library."}
        </p>
      )}

      {/* The two texts */}
      <div aria-live="polite" aria-busy={loading} className={`mt-6 grid gap-4 transition-opacity sm:grid-cols-2 ${loading ? "opacity-50" : ""}`}>
        {[learn, know].map((code) => {
          const lang = languageOf(code);
          const sentences = text.sentences[code] ?? [];
          const voice = pickVoice(voices, lang.tag);
          const isPlaying = speaking?.lang === code;
          const noVoice = !supported || (voices.length > 0 && !voice);
          /** One clickable sentence (or dialogue line) that highlights its translation on hover. */
          const line = (sentence: string, i: number) => {
            const active = isPlaying && speaking?.index === i;
            return (
              <span
                role={voice ? "button" : undefined}
                tabIndex={voice ? 0 : undefined}
                title={voice ? "Listen to this sentence" : undefined}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                onClick={() => voice && speak(code, i)}
                onKeyDown={(e) => {
                  if (voice && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    speak(code, i);
                  }
                }}
                className={`rounded px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${voice ? "cursor-pointer" : ""} ${
                  active ? "bg-sky-200 dark:bg-sky-900" : hovered === i ? "bg-amber-100 dark:bg-amber-900/50" : ""
                }`}
              >
                {sentence}
              </span>
            );
          };
          return (
            <section key={code} lang={lang.tag} aria-label={lang.name} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
                <h2 className="text-xs font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">{lang.name}</h2>
                {noVoice ? (
                  <span className="text-xs text-slate-500">No {lang.name} voice on this device</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => (isPlaying ? stop() : speak(code))}
                    disabled={!voice}
                    aria-label={isPlaying ? `Stop reading ${lang.name}` : `Listen to the ${lang.name} text`}
                    title={isPlaying && speaking?.index === -1 ? "Starting the voice…" : undefined}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-40 dark:bg-white dark:text-slate-900"
                  >
                    {isPlaying && speaking?.index === -1 ? (
                      // Voice still starting: a small spinner (the button still stops it)
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
                    ) : isPlaying ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                        <rect x="5" y="5" width="10" height="10" rx="1.5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 translate-x-px" aria-hidden="true">
                        <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.34-5.89a1.5 1.5 0 0 0 0-2.54L6.3 2.84Z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              {/* Conversations: one line per turn with the speaker's name; otherwise a normal paragraph */}
              {text.speakers ? (
                <ol className="space-y-2.5 leading-relaxed text-slate-800 dark:text-slate-200">
                  {sentences.map((sentence, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className={`w-12 shrink-0 pt-0.5 text-xs font-semibold tracking-wide uppercase ${
                          i % 2 === 0 ? "text-sky-700 dark:text-sky-400" : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {text.speakers![i % 2]}
                      </span>
                      <span>{line(sentence, i)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="leading-relaxed text-slate-800 dark:text-slate-200">
                  {sentences.map((sentence, i) => (
                    <span key={i}>
                      {line(sentence, i)}{" "}
                    </span>
                  ))}
                </p>
              )}
            </section>
          );
        })}
      </div>

      {/* Details and next steps */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">{topicLabel}</span> · {text.level} ·{" "}
          {text.source === "ai" ? "written by AI" : "from the built-in library"}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div role="radiogroup" aria-label="Reading speed" className="flex rounded-full bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
            {SPEEDS.map((option) => (
              <button
                key={option.rate}
                type="button"
                role="radio"
                aria-checked={speed.rate === option.rate}
                onClick={() => setSpeed(option)}
                className={`rounded-full px-2.5 py-1 font-medium whitespace-nowrap ${
                  speed.rate === option.rate ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {harder && (
            <button
              type="button"
              onClick={() => change({ level: harder })}
              disabled={loading}
              className="group inline-flex items-center gap-1.5 font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:text-sky-400"
            >
              Try it harder ({harder})
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          )}
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
        Tip: hover a sentence to highlight its translation, or click (tap) it to hear just that sentence. Voices come
        from your browser, so they vary by device.
      </p>
    </div>
  );
}

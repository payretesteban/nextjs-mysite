import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ReadListen from "../ReadListen";
import { libraryText } from "@/lib/readListen/library";

const initial = libraryText("es", "en", "A2", "market");

// A fake speech engine with Spanish and English voices only. Each sentence "finishes" right after it
// starts (or fails, if its text is in `failing`), like a real engine that speaks very fast.
const failing = new Set<string>();
const speak = vi.fn((u: FakeUtterance) => {
  setTimeout(() => {
    u.onstart?.();
    if (failing.has(u.text)) u.onerror?.({ error: "synthesis-failed" });
    else u.onend?.();
  }, 0);
});
const cancel = vi.fn();
// Silent " " utterances the page uses to load a voice ahead of time are recorded separately
const warmUp = vi.fn();
class FakeUtterance {
  text: string;
  voice!: { name: string; lang: string }; // set by the page before speaking
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}
const voices = [
  { lang: "es-ES", name: "Monica", localService: true },
  { lang: "en-US", name: "Sam", localService: true },
];

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("Read & Listen page", () => {
  beforeEach(() => {
    vi.stubGlobal("speechSynthesis", {
      getVoices: () => voices,
      speak: (u: FakeUtterance) => (u.text.trim() ? speak(u) : warmUp(u)),
      speaking: false,
      cancel,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    speak.mockClear();
    cancel.mockClear();
    warmUp.mockClear();
    failing.clear();
  });

  it("shows the two texts side by side, each marked with its language", () => {
    render(<ReadListen initial={initial} />);
    const spanish = screen.getByRole("region", { name: "Español" });
    expect(spanish).toHaveAttribute("lang", "es-ES");
    expect(within(spanish).getByText(initial.sentences.es![0])).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "English" })).toHaveTextContent(initial.sentences.en![1]);
    expect(screen.getByText(/from the built-in library/)).toBeInTheDocument();
  });

  it("reads a whole text aloud, one sentence after another, or just the clicked sentence", async () => {
    render(<ReadListen initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /listen to the español text/i }));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(initial.sentences.es!.length));
    expect(speak.mock.calls.map((c) => c[0].text)).toEqual(initial.sentences.es);

    speak.mockClear();
    fireEvent.click(within(screen.getByRole("region", { name: "English" })).getByText(initial.sentences.en![1]));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(speak.mock.calls[0][0].text).toBe(initial.sentences.en![1]);
    expect(speak.mock.calls[0][0].voice.name).toBe("Sam");
  });

  it("says so when the device has no voice for a language", async () => {
    const fetchMock = mockFetch(libraryText("fr", "en", "A2", "market"));
    render(<ReadListen initial={initial} />);
    fireEvent.change(screen.getByLabelText(/i'm learning/i), { target: { value: "fr" } });
    await waitFor(() => expect(screen.getByRole("region", { name: "Français" })).toBeInTheDocument());
    expect(screen.getByText(/no français voice on this device/i)).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ learn: "fr", know: "en", level: "A2", variant: 0 });
  });

  it("swaps the languages without asking for a new text", () => {
    const fetchMock = mockFetch({});
    render(<ReadListen initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /swap languages/i }));
    const regions = screen.getAllByRole("region");
    expect(regions[0]).toHaveAccessibleName("English");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for a new variation, and for the next level with 'Try it harder'", async () => {
    const fetchMock = mockFetch({ ...libraryText("es", "en", "B1", "market"), source: "ai" });
    render(<ReadListen initial={initial} />);

    fireEvent.click(screen.getByRole("button", { name: /new text/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ level: "A2", variant: 1 });

    fireEvent.click(screen.getByRole("button", { name: /try it harder \(b1\)/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ level: "B1", variant: 0 });
    expect(await screen.findByText(/written by AI/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "B1" })).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the current text and shows the error when a request fails", async () => {
    mockFetch({ error: "That's a lot of reading! Please try again in a little while." }, false);
    render(<ReadListen initial={initial} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /new text/i }));
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/lot of reading/);
    expect(screen.getByText(initial.sentences.es![0])).toBeInTheDocument();
  });

  it("keeps reading after a sentence fails, and stops when asked", async () => {
    failing.add(initial.sentences.es![1]);
    render(<ReadListen initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /listen to the español text/i }));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(initial.sentences.es!.length));

    await waitFor(() => expect(screen.getByRole("button", { name: /listen to the español text/i })).toBeInTheDocument());
    speak.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /listen to the español text/i }));
    fireEvent.click(screen.getByRole("button", { name: /listen to the english text/i }));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(initial.sentences.en!.length));
    // Only the English reading ran; the Spanish one was replaced before it started
    expect(speak.mock.calls.every((c) => c[0].voice.name === "Sam")).toBe(true);
  });

  it("shows conversations line by line with the speakers' names, alternating how they sound", async () => {
    render(<ReadListen initial={libraryText("es", "en", "A1", "conversation")} />);
    const spanish = screen.getByRole("region", { name: "Español" });
    const lines = within(spanish).getAllByRole("listitem");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toHaveTextContent(/^Sara/);
    expect(lines[1]).toHaveTextContent(/^Tom/);

    fireEvent.click(screen.getByRole("button", { name: /listen to the español text/i }));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(4));
    const [first, second] = speak.mock.calls.map((c) => c[0]);
    expect(first.pitch).not.toBe(second.pitch);
  });

  it("loads the voice of the language being learned ahead of time, silently", () => {
    render(<ReadListen initial={initial} />);
    expect(warmUp).toHaveBeenCalledTimes(1);
    expect(warmUp.mock.calls[0][0].voice.name).toBe("Monica");
    expect(warmUp.mock.calls[0][0].volume).toBe(0);
  });

  it("shows a stop button with a spinner while the voice is starting", () => {
    vi.useFakeTimers();
    try {
      render(<ReadListen initial={initial} />);
      fireEvent.click(screen.getByRole("button", { name: /listen to the español text/i }));
      expect(screen.getByRole("button", { name: /stop reading español/i })).toHaveAttribute("title", "Starting the voice…");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads very slowly, with a pause between sentences, when asked", async () => {
    render(<ReadListen initial={initial} />);
    const speeds = within(screen.getByRole("radiogroup", { name: "Reading speed" })).getAllByRole("radio");
    expect(speeds.map((b) => b.textContent)).toEqual(["Very slow", "Slow", "Normal"]);
    expect(screen.getByRole("radio", { name: "Normal" })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByRole("radio", { name: "Very slow" }));
    fireEvent.click(screen.getByRole("button", { name: /listen to the español text/i }));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(speak.mock.calls[0][0].rate).toBe(0.5);
    // The next sentence waits for the pause after the first one ends
    await new Promise((r) => setTimeout(r, 300));
    expect(speak).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(2), { timeout: 3000 });
  });

  it("shows the beta note for every topic, mentioning that voices can be slow to start", () => {
    const { rerender } = render(<ReadListen initial={initial} />);
    expect(screen.getByText(/is a test version/)).toHaveTextContent(/voice can take a few seconds to start/);
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Conversation" })).toBeInTheDocument();
    rerender(<ReadListen key="conv" initial={libraryText("es", "en", "A1", "conversation")} />);
    expect(screen.getByText(/is a test version/)).toBeInTheDocument();
  });

    it("explains when a built-in text was used because the AI is paused", async () => {
    mockFetch({ ...libraryText("es", "en", "A2", "travel"), notice: "ai-paused" });
    render(<ReadListen initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /new text/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/taking a break/);
  });
});

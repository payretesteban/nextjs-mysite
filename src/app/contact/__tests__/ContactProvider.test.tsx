import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactProvider from "../ContactProvider";
import ContactButton from "../ContactButton";
import { useContact } from "../ContactProvider";

function TopicButton() {
  const contact = useContact();
  return <button onClick={() => contact?.open("consulting", "AI workflows")}>Ask about AI</button>;
}

function setup() {
  render(
    <ContactProvider>
      <ContactButton />
    </ContactProvider>
  );
  fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
  return document.querySelector("dialog") as HTMLDialogElement;
}

const type = (label: RegExp | string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("Let's Work Together form", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens from the button with Consulting selected", () => {
    const dialog = setup();
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByRole("radio", { name: "Consulting & Freelance" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
  });

  it("switches fields for full-time opportunities", () => {
    setup();
    fireEvent.click(screen.getByRole("radio", { name: "Full-Time Opportunities" }));
    expect(screen.getByLabelText(/role title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/job posting link/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/budget/i)).not.toBeInTheDocument();
  });

  it("shows errors next to the fields instead of sending", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    setup();
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();

    type(/^name/i, "Jane");
    expect(screen.queryByText("Please enter your name.")).not.toBeInTheDocument();
  });

  it("sends the form and shows a thank-you", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    setup();

    type(/^name/i, "Jane Doe");
    type(/^email/i, "jane@acme.com");
    fireEvent.change(screen.getByLabelText(/budget/i), { target: { value: "Not sure yet" } });
    type(/message/i, "We need help reviewing our platform architecture.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Thanks, Jane!")).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ type: "consulting", name: "Jane Doe", budget: "Not sure yet", website: "" });
    expect(typeof body.startedAt).toBe("number");
  });

  it("sends the service topic and lets the visitor remove it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ContactProvider>
        <TopicButton />
      </ContactProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Ask about AI" }));
    expect(screen.getByText("About: AI workflows")).toBeInTheDocument();

    type(/^name/i, "Jane Doe");
    type(/^email/i, "jane@acme.com");
    type(/message/i, "We need help reviewing our platform architecture.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText("Thanks, Jane!");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).topic).toBe("AI workflows");
  });

  it("can remove the topic", () => {
    render(
      <ContactProvider>
        <TopicButton />
      </ContactProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Ask about AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove topic AI workflows" }));
    expect(screen.queryByText(/^About:/)).not.toBeInTheDocument();
  });

  it("keeps what was typed when sending fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: "Your message couldn't be sent right now." }) }));
    setup();
    type(/^name/i, "Jane");
    type(/^email/i, "jane@acme.com");
    type(/message/i, "We need help reviewing our platform architecture.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't be sent/));
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Jane");
  });
});

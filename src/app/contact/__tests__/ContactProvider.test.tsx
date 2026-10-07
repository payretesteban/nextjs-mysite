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

  it("shows the server's field errors next to the fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ errors: { email: "Please use a work email." } }) }));
    setup();
    type(/^name/i, "Jane");
    type(/^email/i, "jane@acme.com");
    type(/message/i, "We need help reviewing our platform architecture.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Please use a work email.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't be sent right now/);
  });

  it("explains when the server can't be reached or answers with nonsense", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ ok: false, json: () => Promise.reject(new Error("not JSON")) });
    vi.stubGlobal("fetch", fetchMock);
    setup();
    type(/^name/i, "Jane");
    type(/^email/i, "jane@acme.com");
    type(/message/i, "We need help reviewing our platform architecture.");

    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Couldn't reach the server"));

    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't be sent right now\. Please try again/));
  });

  it("sends a full-time inquiry with all its fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal("fetch", fetchMock);
    setup();
    fireEvent.click(screen.getByRole("radio", { name: "Full-Time Opportunities" }));
    type(/^name/i, "Sam Lee");
    type(/^email/i, "sam@globex.com");
    type(/^company/i, "Globex");
    type(/role title/i, "Engineering Manager");
    fireEvent.change(screen.getByLabelText(/work setup/i), { target: { value: screen.getByLabelText(/work setup/i).querySelectorAll("option")[1].getAttribute("value") } });
    type(/location/i, "Lisbon");
    type(/job posting link/i, "https://globex.com/jobs/1");
    type(/message/i, "We're growing the platform team and need a manager.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByText("Thanks, Sam!")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ type: "fulltime", company: "Globex", role: "Engineering Manager", location: "Lisbon", jobUrl: "https://globex.com/jobs/1" });
  });

  it("closes with the close button, a click on the backdrop or the Esc key", () => {
    const dialog = setup();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(document.documentElement.style.overflow).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
    expect(dialog).toHaveAttribute("open");
    fireEvent.click(dialog); // the backdrop is the dialog element itself
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
    dialog.removeAttribute("open"); // what the browser does on Esc
    fireEvent(dialog, new Event("close"));
    fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
    expect(dialog).toHaveAttribute("open");
  });

  it("starts a fresh form after a message was sent, but keeps a draft otherwise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) }));
    setup();
    type(/^name/i, "Jane");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
    expect(screen.getByLabelText(/^name/i)).toHaveValue("Jane");

    type(/^email/i, "jane@acme.com");
    type(/message/i, "We need help reviewing our platform architecture.");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await screen.findByText("Thanks, Jane!");
    fireEvent.click(screen.getAllByRole("button", { name: "Close" }).at(-1)!);
    fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
    expect(screen.getByLabelText(/^name/i)).toHaveValue("");
  });

  it("moves focus to the name field on desktop, and to the first problem after a failed check", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    setup();
    await waitFor(() => expect(screen.getByLabelText(/^name/i)).toHaveFocus());
    type(/^name/i, "Jane");
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByLabelText(/^email/i)).toHaveFocus());
  });
});

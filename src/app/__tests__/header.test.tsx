import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Header from "../header";
import { AnimationProvider } from "../context/AnimationContext";
import ContactProvider from "../contact/ContactProvider";
import { SanityLink } from "@/lib/types";

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const mockLinks: SanityLink[] = [
  { _id: "1", title: "Home", url: "/", category: "internal" },
  { _id: "2", title: "Blog", url: "/blog", category: "main" },
  {
    _id: "3",
    title: "Funky Mode",
    url: "#",
    category: "fun",
    class: "funky-button funky",
  },
  {
    _id: "4",
    title: "GitHub",
    url: "https://github.com",
    external: true,
  },
  { _id: "5", title: "Mail", url: "mailto:me@example.com" },
];

function renderHeader(pathname = "/") {
  mockUsePathname.mockReturnValue(pathname);
  render(
    <AnimationProvider>
      <Header links={mockLinks} name="Esteban Payret" />
    </AnimationProvider>
  );
  return document.querySelector("dialog") as HTMLDialogElement;
}

describe("Header and ⌘K menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the site's pages in the menu on the homepage", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <AnimationProvider>
        <Header links={mockLinks} />
      </AnimationProvider>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Funky Mode")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("hides the site's pages in the menu on other pages", () => {
    mockUsePathname.mockReturnValue("/blog/post-1");

    render(
      <AnimationProvider>
        <Header links={mockLinks} />
      </AnimationProvider>
    );

    expect(screen.queryByText("Home")).not.toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("shows the full homepage menu on the tests page", () => {
    mockUsePathname.mockReturnValue("/tests");

    render(
      <AnimationProvider>
        <Header links={mockLinks} />
      </AnimationProvider>
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
  });

  it("sets the right attributes on external links", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <AnimationProvider>
        <Header links={mockLinks} />
      </AnimationProvider>
    );

    const externalLink = screen.getByText("GitHub").closest("a");
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("starts fun mode from the funky link", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <AnimationProvider>
        <Header links={mockLinks} />
      </AnimationProvider>
    );

    const funkyBtn = screen.getByText("Funky Mode");
    fireEvent.click(funkyBtn);

    expect(screen.getByText(/More Fun \(10s\)/)).toBeInTheDocument();
  });

  it("shows only the logo, linking home with an accessible name", () => {
    renderHeader();
    expect(screen.getByText("EP")).toBeInTheDocument();
    expect(screen.queryByText("Esteban Payret")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Esteban Payret — home" })).toHaveAttribute("href", "/");
  });

  it("opens the menu from the button and closes it with Esc", () => {
    const dialog = renderHeader();
    expect(dialog).not.toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: /menu|jump to/i }));
    expect(dialog).toHaveAttribute("open");

    fireEvent.click(screen.getByRole("button", { name: "Esc" }));
    expect(dialog).not.toHaveAttribute("open");
  });

  it("toggles the menu with Ctrl+K", () => {
    const dialog = renderHeader();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(dialog).toHaveAttribute("open");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(dialog).not.toHaveAttribute("open");
  });

  it("groups links into pages, elsewhere and actions", () => {
    renderHeader();
    expect(screen.getByRole("group", { hidden: true, name: "Pages" })).toHaveTextContent("Blog");
    expect(screen.getByRole("group", { hidden: true, name: "Elsewhere" })).toHaveTextContent("GitHub");
    expect(screen.getByRole("group", { hidden: true, name: "Actions" })).toHaveTextContent("Funky Mode");
    expect(screen.getByText("Copy email address")).toBeInTheDocument();
  });

  it("filters items as you type", () => {
    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: /menu|jump to/i }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "git" } });

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("runs the highlighted item with the keyboard", () => {
    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: /menu|jump to/i }));
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "funky" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText(/More Fun \(10s\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fun mode: 10 seconds left/i })).toBeInTheDocument();
  });

  it("copies the email address", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderHeader();

    fireEvent.click(screen.getByText("Copy email address"));

    await waitFor(() => expect(screen.getByText("Copied to clipboard")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith("me@example.com");
  });

  it("offers the contact form in the menu when available", () => {
    mockUsePathname.mockReturnValue("/tests");
    render(
      <AnimationProvider>
        <ContactProvider>
          <Header links={mockLinks} name="Esteban Payret" />
        </ContactProvider>
      </AnimationProvider>
    );
    fireEvent.click(screen.getByText("Let’s work together"));
    const dialogs = document.querySelectorAll("dialog");
    expect([...dialogs].some((d) => d.getAttribute("aria-labelledby") === "contact-title" && d.hasAttribute("open"))).toBe(true);
  });
});

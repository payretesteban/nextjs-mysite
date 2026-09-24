import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ServiceList from "../ServiceList";
import ServicesCta from "../ServicesCta";
import ContactProvider from "../../contact/ContactProvider";
import { DEFAULT_SERVICES } from "@/lib/services";
import { SERVICE_ICON_NAMES } from "../icons";

function setup() {
  render(
    <ContactProvider>
      <ServiceList services={DEFAULT_SERVICES} />
      <ServicesCta title="Have a project in mind?" text="Tell me what you need." />
    </ContactProvider>
  );
  return document.querySelector("dialog[aria-labelledby='contact-title']") as HTMLDialogElement;
}

describe("Services list", () => {
  it("shows each service numbered, with its title as a heading and its description", () => {
    setup();
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toContain("Web Development");
    expect(screen.getByText("05")).toBeInTheDocument();
    expect(screen.getByText(/Fast, accessible, search-friendly/)).toBeInTheDocument();
  });

  it("opens the contact form about the clicked service", () => {
    const dialog = setup();
    fireEvent.click(screen.getByRole("button", { name: "Get in touch about Web Development" }));

    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("About: Web Development")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Consulting & Freelance" })).toHaveAttribute("aria-checked", "true");
  });

  it("opens the form without a topic from the bottom banner", () => {
    const dialog = setup();
    fireEvent.click(screen.getByRole("button", { name: "Get in touch about IT Consulting" }));
    fireEvent.click(screen.getByRole("button", { name: /let’s work together/i }));
    expect(dialog).toHaveAttribute("open");
    expect(screen.queryByText(/^About:/)).not.toBeInTheDocument();
  });

  it("has an icon for every icon option offered in the Studio", () => {
    expect(SERVICE_ICON_NAMES.sort()).toEqual(
      ["code", "globe", "megaphone", "compass", "sparkles", "chart", "cloud", "shield", "users", "rocket"].sort()
    );
  });
});

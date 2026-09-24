import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Adventure from "../Adventure";
import { AnimationProvider } from "../../context/AnimationContext";
import ContactProvider from "../../contact/ContactProvider";

function setup() {
  render(
    <AnimationProvider>
      <ContactProvider>
        <Adventure />
      </ContactProvider>
    </AnimationProvider>
  );
  const input = screen.getByLabelText("Your command");
  const send = (cmd: string) => {
    fireEvent.change(input, { target: { value: cmd } });
    fireEvent.submit(input.closest("form")!);
  };
  return { input, send };
}

describe("The Deep Drop page", () => {
  it("starts aboard the plane with metric and imperial units", () => {
    setup();
    expect(screen.getAllByText("Aboard the jump plane").length).toBeGreaterThan(0);
    expect(screen.getByText("ALT 4,000 m · 13,100 ft")).toBeInTheDocument();
  });

  it("runs typed commands and suggestion chips", () => {
    const { send } = setup();
    send("help");
    expect(screen.getByText(/Type short commands like JUMP/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "jump" }));
    expect(screen.getAllByText("Freefall").length).toBeGreaterThan(0);
    expect(screen.getByText(/SCORE 5/)).toBeInTheDocument();
  });

  it("shows game over with a lesson, then retry", () => {
    const { send } = setup();
    ["jump", "deploy main", "pull reserve"].forEach(send);
    expect(screen.getByText(/GAME OVER/)).toBeInTheDocument();
    expect(screen.getByText(/cut away first/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(screen.getByText("Back to the start of this stage.")).toBeInTheDocument();
  });

  it("recalls previous commands with the up arrow", () => {
    const { input, send } = setup();
    send("look");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("look");
  });

  it("opens the contact form when you type hire", () => {
    const { send } = setup();
    send("hire");
    const contactDialog = [...document.querySelectorAll("dialog")].find((d) => d.getAttribute("aria-labelledby") === "contact-title");
    expect(contactDialog).toHaveAttribute("open");
  });
});

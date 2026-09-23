import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../header";
import { AnimationProvider } from "../context/AnimationContext";
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
];

describe("Header Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders internal links when on the home page '/'", () => {
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

  it("filters out internal links when not on the home page", () => {
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

  it("sets correct attributes for external links", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <AnimationProvider>
        <Header links={mockLinks} />
      </AnimationProvider>
    );

    const externalLink = screen.getByText("GitHub");
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("triggers animation countdown on clicking funky link", () => {
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
});

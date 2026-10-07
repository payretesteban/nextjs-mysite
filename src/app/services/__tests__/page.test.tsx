import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ServicesPage, { generateMetadata } from "../page";
import { getServicesPageData } from "@/lib/services";

vi.mock("@/lib/animations", () => ({ Animated: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/services", () => ({ getServicesPageData: vi.fn() }));
vi.mock("@/lib/consultation", () => ({ getConsultation: vi.fn(async () => ({ title: "Free call", bookingUrl: null, buttonLabel: "Book" })) }));
vi.mock("../ServiceList", () => ({ default: ({ services }: { services: unknown[] }) => <p>{services.length} services</p> }));
vi.mock("../ConsultationSection", () => ({ default: ({ consultation }: { consultation: { title: string } }) => <p>Consultation: {consultation.title}</p> }));
vi.mock("../WhyMe", () => ({ default: ({ title, points }: { title: string; points: unknown[] }) => <p>{title} ({points.length})</p> }));
vi.mock("../ServicesCta", () => ({ default: ({ title }: { title: string }) => <p>CTA: {title}</p> }));

const page = { title: "How I can help", intro: "Senior engineering and leadership.", whyTitle: "Why work with me", whyPoints: [{ _key: "a" }], ctaTitle: "Let's talk", ctaText: "…" };

describe("Services page", () => {
  it("shows the title, intro and every section in order", async () => {
    vi.mocked(getServicesPageData).mockResolvedValue({ page, services: [{}, {}, {}] } as never);
    const { container } = render(await ServicesPage());
    expect(screen.getByRole("heading", { level: 1, name: "How I can help" })).toBeInTheDocument();
    expect(screen.getByText("Senior engineering and leadership.")).toBeInTheDocument();
    expect(container.textContent).toMatch(/3 services.*Consultation: Free call.*Why work with me \(1\).*CTA: Let's talk/);
  });

  it("works without an intro or why points", async () => {
    vi.mocked(getServicesPageData).mockResolvedValue({ page: { ...page, intro: null, whyPoints: null }, services: [] } as never);
    render(await ServicesPage());
    expect(screen.queryByText("Senior engineering and leadership.")).not.toBeInTheDocument();
    expect(screen.getByText("Why work with me (0)")).toBeInTheDocument();
  });

  it("takes its browser title and description from Sanity", async () => {
    vi.mocked(getServicesPageData).mockResolvedValue({ page, services: [] } as never);
    await expect(generateMetadata()).resolves.toEqual({ title: "How I can help", description: "Senior engineering and leadership." });
    vi.mocked(getServicesPageData).mockResolvedValue({ page: { ...page, intro: null }, services: [] } as never);
    await expect(generateMetadata()).resolves.toEqual({ title: "How I can help", description: undefined });
  });
});

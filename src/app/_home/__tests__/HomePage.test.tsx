import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import IndexPage from "../../page";
import { getIndexPageData } from "@/lib/data";

vi.mock("@/lib/data", () => ({ getIndexPageData: vi.fn() }));
vi.mock("@/lib/services", () => ({
  getServicesPageData: vi.fn(async () => ({
    page: { title: "Services" },
    services: [
      { _id: "s1", title: "Web Development" },
      { _id: "s2", title: "AI-Assisted Dev Workflows", shortTitle: "AI workflows" },
    ],
  })),
}));
vi.mock("@/lib/siteLog", () => ({
  getSiteLog: vi.fn(async () => [
    { _id: "l1", title: "The Genesis", text: "It all began." },
    { _id: "l2", title: "The Miracle", text: "Stared at the code." },
  ]),
}));
vi.mock("@/lib/image", () => ({
  urlFor: () => ({ width: () => ({ height: () => ({ url: () => "https://cdn.example/avatar.jpg" }) }) }),
}));
vi.mock("@/lib/animations", () => ({
  default: ({ headline }: { headline: string }) => <p>{headline}</p>,
  Animated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const posts = Array.from({ length: 8 }, (_, i) => ({
  _id: `p${i}`,
  title: `Post ${i + 1}`,
  slug: { current: `post-${i + 1}` },
  publishedAt: "2026-09-01T00:00:00Z",
  featured: i === 0,
}));

const profile = {
  name: "Esteban Payret",
  headline: "Tech Lead & People Manager",
  bio: [{ _type: "block", _key: "b", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "I build software and lead teams.", marks: [] }] }],
  profileImage: { asset: { _ref: "image-1" }, alt: "Esteban smiling" },
};

const fetchMock = vi.mocked(getIndexPageData) as unknown as ReturnType<typeof vi.fn>;

describe("Homepage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("introduces me with a photo, headline, bio and the contact and services links", async () => {
    fetchMock.mockResolvedValue({ posts, postCount: 8, profile, links: [] });
    render(await IndexPage());

    expect(screen.getByRole("heading", { level: 1, name: "Esteban Payret" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Esteban smiling" })).toHaveAttribute("src", "https://cdn.example/avatar.jpg");
    expect(screen.getByText("Tech Lead & People Manager")).toBeInTheDocument();
    expect(screen.getByText("I build software and lead teams.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /let.s work together/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see all services/i })).toHaveAttribute("href", "/services");
  });

  it("shows the first 5 posts, featured first, with a link to all of them", async () => {
    fetchMock.mockResolvedValue({ posts, postCount: 8, profile, links: [] });
    render(await IndexPage());

    const section = screen.getByRole("region", { name: "Posts" });
    expect(within(section).getAllByRole("listitem")).toHaveLength(5);
    expect(within(section).getByRole("list", { name: /featured posts/i })).toHaveTextContent("Post 1");
    expect(within(section).getByRole("link", { name: /see all 8 posts/i })).toHaveAttribute("href", "/posts");
    expect(within(section).queryByText("Post 6")).not.toBeInTheDocument();
  });

  it("ends with the site log notes and a link to the full log", async () => {
    fetchMock.mockResolvedValue({ posts, postCount: 8, profile, links: [] });
    render(await IndexPage());

    const section = screen.getByRole("region", { name: "Site log" });
    expect(within(section).getByRole("heading", { level: 3, name: "The Genesis" })).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: /read the full log/i })).toHaveAttribute("href", "/site-log");
  });

  it("still shows posts and the site log when there's no profile or photo yet", async () => {
    fetchMock.mockResolvedValue({ posts: posts.slice(0, 3), postCount: 3, profile: null, links: [] });
    render(await IndexPage());

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Posts" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Site log" })).toBeInTheDocument();
  });
});

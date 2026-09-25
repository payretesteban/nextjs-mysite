import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PostsPage from "../page";
import { getAllPosts } from "@/lib/data";

vi.mock("@/lib/data", () => ({ getAllPosts: vi.fn() }));
vi.mock("@/lib/animations", () => ({
  Animated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const post = (i: number, featured = false) => ({
  _id: `p${i}`,
  title: `Post ${i}`,
  slug: { current: `post-${i}` },
  publishedAt: "2026-09-01T00:00:00Z",
  featured,
});

describe("All posts page", () => {
  it("lists every post, featured ones first", async () => {
    vi.mocked(getAllPosts).mockResolvedValue([post(1, true), ...Array.from({ length: 7 }, (_, i) => post(i + 2))]);
    render(await PostsPage());

    expect(screen.getByRole("heading", { level: 1, name: "Posts" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.getByRole("list", { name: /featured posts/i })).toHaveTextContent("Post 1");
    expect(screen.queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
  });

  it("says so when there are no posts yet", async () => {
    vi.mocked(getAllPosts).mockResolvedValue([]);
    render(await PostsPage());

    expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
  });
});

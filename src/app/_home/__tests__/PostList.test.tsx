import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PostList from "../PostList";

const post = (i: number, extra = {}) => ({
  _id: `p${i}`,
  title: `Post ${i}`,
  slug: { current: `post-${i}` },
  publishedAt: `2026-0${(i % 9) + 1}-15T12:00:00Z`,
  featured: false,
  ...extra,
});
const posts = Array.from({ length: 8 }, (_, i) => post(i + 1));

describe("PostList", () => {
  it("shows only `limit` posts and a link to all of them", () => {
    render(<PostList posts={posts} limit={5} total={12} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: /see all 12 posts/i })).toHaveAttribute("href", "/posts");
  });

  it("hides the 'See all' link when everything already fits", () => {
    render(<PostList posts={posts.slice(0, 3)} limit={5} total={3} />);
    expect(screen.queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
  });

  it("shows every post without a limit", () => {
    render(<PostList posts={posts} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
  });

  it("links each post to its page with the featured badge, and shows no dates", () => {
    render(<PostList posts={[post(1, { featured: true }), post(2)]} />);
    expect(screen.getByRole("link", { name: /post 1/i })).toHaveAttribute("href", "/post-1");
    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it("says so when there are no posts", () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
  });
});

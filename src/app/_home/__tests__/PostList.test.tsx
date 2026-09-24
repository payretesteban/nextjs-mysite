import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PostList from "../PostList";
import HomePosts from "../HomePosts";

const post = (i: number, extra = {}) => ({
  _id: `p${i}`,
  title: `Post ${i}`,
  slug: { current: `post-${i}` },
  publishedAt: `2026-0${(i % 9) + 1}-15T12:00:00Z`,
  featured: false,
  ...extra,
});
const posts = Array.from({ length: 8 }, (_, i) => post(i + 1));

describe("Posts list", () => {
  it("shows featured posts first in their own highlighted list, then the rest", () => {
    render(<PostList posts={[post(1), post(2, { featured: true }), post(3)]} />);
    const featured = screen.getByRole("list", { name: /featured posts/i });
    expect(within(featured).getByRole("link", { name: /post 2/i })).toHaveAttribute("href", "/post-2");
    expect(within(featured).getByText("Featured")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getAllByText("Featured")).toHaveLength(1);
  });

  it("has no featured list when nothing is featured, and shows no dates", () => {
    render(<PostList posts={posts} />);
    expect(screen.queryByRole("list", { name: /featured posts/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(8);
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it("says so when there are no posts", () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
  });
});

describe("Homepage posts panel", () => {
  it("shows only `limit` posts and a link to all of them", () => {
    render(<HomePosts posts={posts} limit={5} total={12} />);
    expect(screen.getByRole("heading", { name: "Posts" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: /see all 12 posts/i })).toHaveAttribute("href", "/posts");
  });

  it("hides the 'See all' link when everything already fits", () => {
    render(<HomePosts posts={posts.slice(0, 3)} limit={5} total={3} />);
    expect(screen.queryByRole("link", { name: /see all/i })).not.toBeInTheDocument();
  });
});

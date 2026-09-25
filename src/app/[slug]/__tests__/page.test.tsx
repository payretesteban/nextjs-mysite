import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PostPage, { generateStaticParams } from "../page";
import { client } from "@/sanity/client";
import { notFound } from "next/navigation";

vi.mock("@/sanity/client", () => ({ client: { fetch: vi.fn() } }));
vi.mock("@/lib/image", () => ({
  urlFor: () => ({ width: () => ({ height: () => ({ url: () => "https://cdn.example/cover.jpg" }) }) }),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/animations", () => ({
  Animated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const fetchMock = vi.mocked(client.fetch) as unknown as ReturnType<typeof vi.fn>;
const params = (slug: string) => Promise.resolve({ slug });

describe("Post page", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("shows the post's title, cover image and body, with a way back", async () => {
    fetchMock.mockResolvedValue({
      title: "Testing in public",
      image: { asset: { _ref: "image-1" } },
      body: [{ _type: "block", _key: "b", style: "normal", markDefs: [], children: [{ _type: "span", _key: "s", text: "Why I show my tests.", marks: [] }] }],
    });
    render(await PostPage({ params: params("testing-in-public") }));

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("slug.current == $slug"), { slug: "testing-in-public" });
    expect(screen.getByRole("heading", { level: 1, name: "Testing in public" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Testing in public" })).toHaveAttribute("src", "https://cdn.example/cover.jpg");
    expect(screen.getByText("Why I show my tests.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute("href", "/");
  });

  it("works for posts without a cover image or body", async () => {
    fetchMock.mockResolvedValue({ title: "Short note" });
    render(await PostPage({ params: params("short-note") }));

    expect(screen.getByRole("heading", { level: 1, name: "Short note" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("sends visitors to the 404 page when the post doesn't exist", async () => {
    fetchMock.mockResolvedValue(null);
    await expect(PostPage({ params: params("nope") })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("renders inside the layout's <main> instead of adding a second one", async () => {
    fetchMock.mockResolvedValue({ title: "Short note" });
    const { container } = render(await PostPage({ params: params("short-note") }));
    expect(container.querySelector("main")).toBeNull();
  });

  it("pre-builds a page for every post", async () => {
    fetchMock.mockResolvedValue([{ slug: "a" }, { slug: "b" }]);
    await expect(generateStaticParams()).resolves.toEqual([{ slug: "a" }, { slug: "b" }]);
  });
});

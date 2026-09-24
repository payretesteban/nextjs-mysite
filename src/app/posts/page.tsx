import type { Metadata } from "next";
import { Animated } from "@/lib/animations";
import { getAllPosts } from "@/lib/data";
import PostList from "../_home/PostList";

export const metadata: Metadata = {
  title: "Posts",
  description: "Everything I've written, newest first.",
};

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="container mx-auto min-h-screen max-w-3xl p-8">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">
          <Animated>Posts</Animated>
        </h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Everything I&apos;ve written, featured posts first.
        </p>
      </section>

      <PostList posts={posts} />
    </div>
  );
}

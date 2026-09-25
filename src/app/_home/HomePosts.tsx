import Link from "next/link";
import type { SanityPost } from "@/lib/types";
import Arrow from "./Arrow";
import PostList from "./PostList";

/**
 * The homepage Posts section: a soft tinted panel with the first few posts and "See all".
 *
 * @param posts - Posts to pick from, featured first.
 * @param limit - How many posts to show.
 * @param total - Total number of posts in Sanity, shown in the "See all" link when some are hidden.
 */
export default function HomePosts({ posts, limit, total }: { posts: SanityPost[]; limit: number; total?: number }) {
  const shown = posts.slice(0, limit);
  const count = Math.max(total ?? 0, posts.length);
  const hasMore = count > shown.length;

  return (
    <section
      aria-labelledby="posts-heading"
      className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/70 sm:p-8 dark:bg-slate-900/50 dark:ring-slate-800"
    >
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <h2 id="posts-heading" className="text-2xl font-bold tracking-tight">
          Posts
        </h2>
        {hasMore && (
          <Link
            href="/posts"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400"
          >
            See all {count} posts
            <Arrow />
          </Link>
        )}
      </div>
      <PostList posts={shown} />
    </section>
  );
}

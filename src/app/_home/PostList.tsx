import Link from "next/link";
import type { SanityPost } from "@/lib/types";
import Arrow from "./Arrow";

/**
 * Posts as clean rows: a small mono caret on the left (matches the <EP/> logo), then the title.
 * Pass `limit` to show only the first few, with a "See all posts" link underneath.
 */
export default function PostList({ posts, limit, total }: { posts: SanityPost[]; limit?: number; total?: number }) {
  const shown = limit ? posts.slice(0, limit) : posts;
  const count = Math.max(total ?? 0, posts.length);
  const hasMore = limit !== undefined && count > shown.length;

  if (!shown.length) return <p className="text-slate-500">No posts yet.</p>;

  return (
    <>
      <ul className="divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800 dark:border-slate-800">
        {shown.map((post) => (
          <li key={post._id}>
            <Link
              href={`/${post.slug.current}`}
              className="group flex items-baseline gap-3 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:gap-4"
            >
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-sm font-semibold text-sky-600/50 transition-all group-hover:translate-x-0.5 group-hover:text-sky-600 dark:text-sky-400/50 dark:group-hover:text-sky-400"
              >
                &gt;
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-lg leading-snug font-medium tracking-tight text-slate-800 transition-colors group-hover:text-sky-700 dark:text-slate-200 dark:group-hover:text-sky-400">
                  {post.title}
                </span>
                {post.featured && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-800 uppercase">
                    Featured
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <Link
          href="/posts"
          className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-sky-400"
        >
          See all {count} posts
          <Arrow />
        </Link>
      )}
    </>
  );
}

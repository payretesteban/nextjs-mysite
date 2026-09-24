import Link from "next/link";
import type { SanityPost } from "@/lib/types";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

function Star() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-500">
      <path d="M10 1.8l2.47 5.1 5.6.78-4.07 3.93.98 5.57L10 14.5l-4.98 2.68.98-5.57L1.93 7.68l5.6-.78L10 1.8z" />
    </svg>
  );
}

/** Decorative ">" drawn as an icon, so its faded color doesn't count as low-contrast text. */
function Caret() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-3 w-3 shrink-0 text-sky-600/50 transition-all group-hover:translate-x-0.5 group-hover:text-sky-600 dark:text-sky-400/50 dark:group-hover:text-sky-400"
    >
      <path d="M5 3l6 5-6 5" />
    </svg>
  );
}

/**
 * Featured posts first, as highlighted white rows with a star; the rest as plain rows
 * with a small caret. No dates on purpose.
 */
export default function PostList({ posts }: { posts: SanityPost[] }) {
  if (!posts.length) return <p className="text-slate-500 dark:text-slate-400">No posts yet.</p>;

  const featured = posts.filter((post) => post.featured);
  const regular = posts.filter((post) => !post.featured);

  return (
    <div>
      {featured.length > 0 && (
        <ul className="space-y-2" aria-label="Featured posts">
          {featured.map((post) => (
            <li key={post._id}>
              <Link
                href={`/${post.slug.current}`}
                className={`group flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-amber-200 transition hover:shadow-md hover:ring-amber-300 dark:bg-slate-900 dark:ring-amber-500/30 dark:hover:ring-amber-400/60 ${focusRing}`}
              >
                <Star />
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-lg leading-snug font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-400">
                    {post.title}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-800 uppercase sm:ml-auto">
                    Featured
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {regular.length > 0 && (
        <ul className={`divide-y divide-slate-200/70 dark:divide-slate-800 ${featured.length ? "mt-3" : ""}`}>
          {regular.map((post) => (
            <li key={post._id}>
              <Link href={`/${post.slug.current}`} className={`group flex items-center gap-3 rounded-lg px-4 py-3 ${focusRing}`}>
                <Caret />
                <span className="text-lg leading-snug font-medium tracking-tight text-slate-800 transition-colors group-hover:text-sky-700 dark:text-slate-200 dark:group-hover:text-sky-400">
                  {post.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

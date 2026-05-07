"use client";

import { usePathname } from "next/navigation";
import { SanityLink } from "@/lib/types";

export default function Header({ links }: { links: SanityLink[] }) {
  const pathname = usePathname();

  const visibleLinks =
    pathname === "/"
      ? links
      : links.filter((link) => link.category !== "internal");

  return (
    <header className="container mx-auto max-w-3xl p-8 pb-0">
      <nav className="flex gap-4 border-b border-slate-200 pb-8">
        {visibleLinks.map((link) => (
          <a
            key={link._id}
            href={link.url}
            target={link.external ? "_blank" : "_self"}
            rel={link.external ? "noopener noreferrer" : undefined}
            className={`px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-colors ${link.class}`}
          >
            {link.title}
          </a>
        ))}
      </nav>
    </header>
  );
}
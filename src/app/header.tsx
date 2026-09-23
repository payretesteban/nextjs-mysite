"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SanityLink } from "@/lib/types";
import { useAnimation } from "./context/AnimationContext";
import CommandMenu, { Icon, Kbd, iconForUrl, isExternalUrl, type MenuItem } from "./command-menu";

// Pages that show the same full menu as the homepage
const FULL_MENU_PATHS = ["/", "/tests"];

const noopSubscribe = () => () => {};

/**
 * False during the server render and hydration, true afterwards. Anything that depends on the
 * current URL must wait for this: the server-rendered layout doesn't always know the pathname,
 * and rendering different menu items on the client causes a hydration error (React #418).
 */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** ⌘K on Apple devices, Ctrl K elsewhere (server render assumes Ctrl K). */
function useShortcutLabel() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K"
  );
}

export default function Header({
  links,
  name = "Esteban Payret",
}: {
  links: SanityLink[];
  name?: string;
}) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  // Pathname used for rendering: null until hydrated so server and client markup match
  const currentPath = hydrated ? pathname : null;
  const { getNextAnimation, animationClass, timeLeft } = useAnimation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shortcut = useShortcutLabel();
  const [prevPathname, setPrevPathname] = useState(pathname);

  const animationsRunning = animationClass !== "";

  // Close the menu when the route changes (adjusting state during render, no effect needed)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // ⌘K / Ctrl+K toggles the menu; "/" opens it when you're not typing
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, [contenteditable]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCopied(false);
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<MenuItem[]>(() => {
    // Internal links are only shown on pages that use the full global menu
    const visibleLinks = currentPath !== null && FULL_MENU_PATHS.includes(currentPath)
      ? links
      : links.filter((l) => l.category !== "internal");

    const result: MenuItem[] = [];
    if (!links.some((l) => l.url === "/")) {
      result.push({ id: "home", label: "Home", group: "Pages", icon: "home", href: "/", current: currentPath === "/" });
    }

    for (const link of visibleLinks) {
      if (link.class?.includes("funky")) {
        result.push({
          id: link._id,
          label: animationsRunning ? `More Fun (${timeLeft}s)` : link.title,
          group: "Actions",
          icon: "sparkles",
          keywords: `${link.title} fun animation party`,
          run: getNextAnimation,
        });
        continue;
      }

      const external = Boolean(link.external) || isExternalUrl(link.url);
      result.push({
        id: link._id,
        label: link.title,
        group: external ? "Elsewhere" : "Pages",
        icon: iconForUrl(link.url),
        href: link.url,
        external,
        current: !external && currentPath === link.url,
        hint: external ? undefined : currentPath === link.url ? "Current page" : undefined,
        keywords: link.url,
      });

      if (link.url.startsWith("mailto:")) {
        const email = link.url.slice(7).split("?")[0];
        result.push({
          id: `${link._id}-copy`,
          label: copied ? "Copied to clipboard" : "Copy email address",
          group: "Actions",
          icon: copied ? "check" : "copy",
          hint: email,
          keywords: "email contact",
          run: async () => {
            try {
              await navigator.clipboard.writeText(email);
              setCopied(true);
            } catch {
              window.location.href = link.url;
            }
          },
        });
      }
    }
    return result;
  }, [links, currentPath, animationsRunning, timeLeft, getNextAnimation, copied]);

  const onOpenChange = useCallback((o: boolean) => {
    setOpen(o);
    if (!o) setCopied(false);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800/70 dark:bg-[#0a0a0a]/80">
      <nav aria-label="Main" className="container mx-auto flex max-w-3xl items-center gap-3 px-8 py-4">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white transition-transform group-hover:-rotate-6 dark:bg-white dark:text-slate-900">
            {name
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <span className="truncate whitespace-nowrap">{name}</span>
        </Link>

        <span className="flex-1" />

        {animationsRunning && (
          <button
            type="button"
            onClick={getNextAnimation}
            aria-label={`Fun mode: ${timeLeft} seconds left. Try another animation`}
            className="funky inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs tabular-nums"
          >
            <Icon name="sparkles" className="h-3.5 w-3.5" />
            {timeLeft}s
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white"
        >
          <Icon name="search" className="hidden h-4 w-4 sm:block" />
          <Icon name="menu" className="h-4 w-4 sm:hidden" />
          <span className="sm:hidden">Menu</span>
          <span className="hidden sm:inline">Jump to…</span>
          <span className="hidden sm:inline">
            <Kbd>{shortcut}</Kbd>
          </span>
        </button>

        <CommandMenu items={items} open={open} onOpenChange={onOpenChange} />
      </nav>
    </header>
  );
}

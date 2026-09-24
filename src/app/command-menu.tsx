"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

type Group = "Pages" | "Elsewhere" | "Actions";
const GROUP_ORDER: Group[] = ["Pages", "Elsewhere", "Actions"];

export type IconName =
  | "home"
  | "page"
  | "linkedin"
  | "github"
  | "mail"
  | "external"
  | "sparkles"
  | "copy"
  | "check"
  | "send"
  | "briefcase"
  | "flask"
  | "gauge"
  | "gamepad"
  | "notes"
  | "pencil"
  | "user"
  | "code";

export interface MenuItem {
  id: string;
  label: string;
  group: Group;
  icon: IconName;
  /** Links render as <a>; items with `run` render as <button>. */
  href?: string;
  external?: boolean;
  run?: () => void | Promise<void>;
  hint?: string;
  current?: boolean;
  keywords?: string;
}

export function isExternalUrl(url: string) {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

/** Icons for the site's own pages, picked from the page's address and title. First match wins. */
const PAGE_ICON_RULES: [RegExp, IconName][] = [
  [/servic|consult|hire/i, "briefcase"],
  [/test|quality/i, "flask"],
  [/perform|speed|lighthouse/i, "gauge"],
  [/adventure|game|deep drop/i, "gamepad"],
  [/site-?log|changelog|notes/i, "notes"],
  [/post|blog|writ|article/i, "pencil"],
  [/about|profile|resume|\bcv\b/i, "user"],
  [/project|portfolio|code/i, "code"],
];

export function iconForUrl(url: string, title = ""): IconName {
  if (url === "/") return "home";
  if (url.startsWith("mailto:")) return "mail";
  if (/linkedin\.com/i.test(url)) return "linkedin";
  if (/github\.com/i.test(url)) return "github";
  if (isExternalUrl(url)) return "external";
  const text = `${url} ${title}`;
  return PAGE_ICON_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? "page";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CommandMenu({
  items,
  open,
  onOpenChange,
}: {
  items: MenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // Open / close the native <dialog> (gives us focus trapping, Esc and a backdrop for free).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      document.documentElement.style.overflow = "hidden";
      // Focus search on desktop; on touch screens don't pop the keyboard up straight away
      requestAnimationFrame(() => {
        if (window.matchMedia?.("(pointer: coarse)").matches) dialog.focus();
        else inputRef.current?.focus();
      });
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  // Reset the search each time the menu closes (adjusting state during render, no effect needed)
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }

  // Esc / native close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onOpenChange(false);
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onOpenChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? items.filter((i) =>
          [i.label, i.hint, i.keywords, i.group].join(" ").toLowerCase().includes(q)
        )
      : items;
    // Keep group order stable
    return GROUP_ORDER.flatMap((g) => matches.filter((i) => i.group === g));
  }, [items, query]);

  useEffect(() => {
    itemRefs.current[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!filtered.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      itemRefs.current[active]?.click();
    }
  }

  const indexOf = new Map(filtered.map((item, i) => [item.id, i]));

  return (
    <dialog
      ref={dialogRef}
      aria-label="Site menu"
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(); // backdrop click
      }}
      className="m-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm open:animate-fade-up dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 outline-none"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 dark:border-slate-800">
        <Icon name="search" className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-menu-list"
          aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
          aria-autocomplete="list"
          placeholder="Where do you want to go?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 font-mono text-[11px] text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Esc
        </button>
      </div>

      <div id="command-menu-list" role="listbox" aria-label="Menu items" className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-slate-500">
            No results for &ldquo;{query}&rdquo;
          </p>
        )}

        {GROUP_ORDER.map((group) => {
          const groupItems = filtered.filter((i) => i.group === group);
          if (!groupItems.length) return null;
          return (
            <div key={group} role="group" aria-label={group} className="mb-1 last:mb-0">
              <p className="px-3 pt-2 pb-1 text-xs font-medium text-slate-400">{group}</p>
              {groupItems.map((item) => {
                const i = indexOf.get(item.id) ?? 0;
                const isActive = i === active;
                const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`;
                const content = (
                  <>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                        isActive
                          ? "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                    {item.hint && (
                      <span className="shrink-0 truncate text-xs text-slate-400">{item.hint}</span>
                    )}
                    {item.external && <Icon name="arrow-up-right" className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  </>
                );
                const common = {
                  id: `cmd-${item.id}`,
                  role: "option" as const,
                  "aria-selected": isActive,
                  className,
                  onMouseMove: () => setActive(i),
                  ref: (el: HTMLAnchorElement | HTMLButtonElement | null) => {
                    itemRefs.current[i] = el;
                  },
                };

                if (item.run) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      {...common}
                      onClick={async () => {
                        await item.run?.();
                        if (item.icon !== "copy") close();
                      }}
                    >
                      {content}
                    </button>
                  );
                }
                if (item.external) {
                  return (
                    <a
                      key={item.id}
                      {...common}
                      href={item.href}
                      target={item.href?.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      onClick={close}
                    >
                      {content}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.id}
                    {...common}
                    href={item.href ?? "/"}
                    aria-current={item.current ? "page" : undefined}
                    onClick={close}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="hidden items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400 sm:flex dark:border-slate-800">
        <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate</span>
        <span><Kbd>↵</Kbd> to open</span>
        <span><Kbd>esc</Kbd> to close</span>
      </div>
    </dialog>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Icons (inline so there's no extra dependency)                       */
/* ------------------------------------------------------------------ */

const PATHS: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>,
  page: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  external: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  sparkles: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2 2M16 16l2 2M6 18l2-2M16 8l2-2" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7.5 15h9" /></>,
  gauge: <><path d="M4.2 18a9 9 0 1 1 15.6 0" /><path d="m12 14 4-4.5" /><circle cx="12" cy="14" r="1.2" /></>,
  gamepad: <><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 10.5v4M5 12.5h4M15.5 12h.01M18 14h.01" /></>,
  notes: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  linkedin: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>,
  github: <path d="M9 19c-4 1.5-4-2-6-2.5m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />,
};

export function Icon({ name, className }: { name: IconName | "search" | "arrow-up-right" | "menu"; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

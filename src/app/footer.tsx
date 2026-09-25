import type { SanityLink } from "@/lib/types";
import { BUILD_COMMIT, SITE_VERSION } from "@/lib/version";
import { Icon } from "./command-menu";
import FooterContactButton from "./contact/FooterContactButton";

/** Used when the Sanity links don't include these profiles. */
const DEFAULT_LINKEDIN = "https://www.linkedin.com/in/esteban-payret/";
const DEFAULT_GITHUB = "https://github.com/payretesteban";

/** Shared classes for the round social and contact buttons. */
const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white";

/**
 * Site footer with LinkedIn, GitHub and contact buttons, plus copyright and site version.
 * @param props.links - Sanity links; the LinkedIn and GitHub URLs are taken from here when present.
 */
export default function Footer({ links = [] }: { links?: SanityLink[] }) {
  // First link URL that matches the pattern, if any
  const find = (pattern: RegExp) => links.find((link) => pattern.test(link.url))?.url;
  const socials = [
    { name: "LinkedIn", icon: "linkedin" as const, url: find(/linkedin\.com/i) ?? DEFAULT_LINKEDIN },
    { name: "GitHub", icon: "github" as const, url: find(/github\.com/i) ?? DEFAULT_GITHUB },
  ];

  return (
    <footer className="container mx-auto max-w-3xl p-8 text-center text-xs">
      <nav aria-label="Elsewhere" className="mb-3 flex items-center justify-center gap-1">
        {socials.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={`${s.name} (opens in a new tab)`}
            title={s.name}
            className={iconButton}
          >
            <Icon name={s.icon} className="h-[18px] w-[18px]" />
          </a>
        ))}
        <FooterContactButton className={iconButton} />
      </nav>
      © {new Date().getFullYear()} Esteban Payret
      <span aria-hidden="true" className="mx-2 text-slate-300 dark:text-slate-700">
        ·
      </span>
      <span
        className="font-mono text-slate-500 dark:text-slate-400"
        title={BUILD_COMMIT ? `Version ${SITE_VERSION} (build ${BUILD_COMMIT})` : `Version ${SITE_VERSION}`}
      >
        v{SITE_VERSION}
      </span>
    </footer>
  );
}

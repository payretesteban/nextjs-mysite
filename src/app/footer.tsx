import { BUILD_COMMIT, SITE_VERSION } from "@/lib/version";

export default function Footer() {
  return (
    <footer className="container mx-auto max-w-3xl p-8 text-center text-xs">
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

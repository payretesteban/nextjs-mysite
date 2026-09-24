import pkg from "../../package.json";

/** The site's release version, e.g. "1.0.0". Bump it with `npm version patch|minor|major` (see CHANGELOG.md). */
export const SITE_VERSION: string = pkg.version;

/** Short commit ID of the deployed build (set by Vercel), or null locally. */
export const BUILD_COMMIT: string | null = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null;

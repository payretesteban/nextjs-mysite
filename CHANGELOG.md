# Changelog

All notable changes to estebanpayret.com. Versions follow [Semantic Versioning](https://semver.org):

- **Major** (2.0.0): a redesign or anything that changes how the site works as a whole
- **Minor** (1.1.0): a new page or feature
- **Patch** (1.0.1): fixes and small tweaks

The version shown in the site footer comes from `package.json`.

## How to release

1. Commit your changes.
2. Run `npm version patch` (or `minor` / `major`). This bumps `package.json`, commits it and creates the `vX.Y.Z` git tag.
3. Add a short entry at the top of this file (it can go in the same push).
4. `git push --follow-tags`

Versions before 1.0.0 were added retroactively on Sept 24, 2026 by tagging past commits.

## 1.3.2 — 2026-09-25

- Contact form recipient comes only from the `CONTACT_TO_EMAIL` setting, so the address isn't in the public code. Without it the form refuses to send instead of guessing.

## 1.3.1 — 2026-09-25

- Consistent code comments: JSDoc on every function, component and shared type (no code changes).
- README rewritten for this project, with typos fixed.

## 1.3.0 — 2026-09-24

- Footer links to LinkedIn and GitHub, plus an envelope button that opens the contact form (no email address exposed to spam bots).

## 1.2.1 — 2026-09-24

- Performance page tests Desktop by default (Mobile is one click away); easier-to-read device toggle.

## 1.2.0 — 2026-09-24

- The /tests page shows code coverage: a "Coverage" tile with the share of lines covered, plus statements, functions and branches underneath. Measured on every build and live run.

## 1.1.1 — 2026-09-24

- Proper 404 page for unknown addresses and missing posts (real 404 status, not indexed by search engines).
- Test coverage report: `npm run test:coverage`. Coverage raised from 83% to 90% of lines with tests for the homepage, post pages, /posts, the game story and live test runs.
- Post page no longer nests a second `<main>` inside the layout's.

## 1.1.0 — 2026-09-24 · `2473cb8`

- Added the test coverage tool (`@vitest/coverage-v8`). The rest of this release landed in 1.1.1.

## 1.0.1 — 2026-09-24

- Each page in the ⌘K menu has its own icon (tests, services, performance, game, posts, site log), picked from the page's address and title.

## 1.0.0 — 2026-09-24

- Site version shown in the footer, this changelog, and git tags for every past release.

## 0.15.0 — 2026-09-24 · `f494635`

- /tests page groups results by part of the site, with plain-language test names.

## 0.14.0 — 2026-09-24 · `2ccfb1e`

- Posts in a tinted panel with featured posts highlighted at the top.
- Intro with a small avatar beside the name, aligned with the rest of the page.

## 0.13.1 — 2026-09-24 · `35fe9d6`

- Site log style tweaks.
- Accessibility: fixed low-contrast text (Lighthouse back to 100).

## 0.13.0 — 2026-09-24 · `42d28ac`

- Site log as sticky notes on the homepage, with a /site-log page from Sanity.
- Homepage shows 5 posts with a link to the new /posts page.

## 0.12.0 — 2026-09-24 · `4ee75f9`

- Services page managed in Sanity, with a rotating services link on the homepage.
- Sitemap fixed to list real post addresses.

## 0.11.0 — 2026-09-24 · `0e1acd1`

- The Deep Drop, a skydive and cave-dive text adventure.

## 0.10.1 — 2026-09-24 · `904d4f1`

- New `<EP/>` code-tag logo; name removed from the header.

## 0.10.0 — 2026-09-24 · `988a1d5`

- "Let's Work Together" contact form and homepage button.

## 0.9.0 — 2026-09-23 · `d14f5ee`

- Performance page with live Lighthouse tests via PageSpeed Insights.

## 0.8.1 — 2026-09-23 · `49305a8`

- Fun mode animations on every page.
- Fixed the React hydration error (#418).

## 0.8.0 — 2026-09-23 · `9e8202b`

- New header with a ⌘K command menu.

## 0.7.0 — 2026-09-23 · `0039cff`

- Live /tests page showing the test results.

## 0.6.0 — 2026-09-16 · `49859a7`

- Unit and component tests with Vitest and Testing Library.

## 0.5.1 — 2026-05-10 · `577323d`

- Removed Vercel Speed Insights.

## 0.5.0 — 2026-05-08 · `21b5d72`

- Fun mode: header animations with a timer.
- Hydration error fixes, font tweaks, header clean-up.

## 0.4.0 — 2026-05-07 · `2b1ae7f`

- Header links from Sanity, content and type improvements.

## 0.3.1 — 2026-04-16 · `b10a487`

- Vercel Speed Insights, post dates removed, footer and README updates, dark-mode menu fix.

## 0.3.0 — 2026-04-16 · `f0e4441`

- Global header and footer.

## 0.2.0 — 2026-04-15 · `491df2f`

- Sitemap and robots.txt, profile/about section, SEO metadata from Sanity, modular code structure.

## 0.1.0 — 2026-04-10 · `2838208`

- First version: homepage with posts from Sanity.

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

## 1.13.0 — 2026-10-13

- Wider layout on large screens (1280px and up): the header, pages and footer grow from about 770px to 1150px. On the homepage the intro (with the bio justified on tablets and up), the free consultation panel and The Lab run across the full width, and Posts and the Site log sit side by side. Post pages keep a narrow column for easy reading; phones, tablets and laptops look the same as before.
- The Circuit traces on the right edge only show on very wide screens (1560px and up), and the Halloween skeleton and pumpkins skip the 1280–1439px range, so they never cover the wider content.
- Free consultation panel: on wide screens the right half shows "how it works" as three numbered steps on a line (Pick a time → 30-minute call → Your next step), behind a thin divider. Steps are editable in Sanity (Free consultation → Homepage → How it works).
- "Explore My Services" is now an outlined button with a briefcase icon and a moving arrow, followed by "5 services · incl. …" with the service names rotating (hidden on phones; screen readers get the full list).
- Circuit header: the single glowing blip along the bottom line is replaced by two small, faint dashes that travel along it slowly, like the pulses on the circuit traces.
- The Minimalist theme is now called Clean. Anyone who had picked it keeps it.

## 1.12.1 — 2026-10-13

- Circuit header: its bottom edge is now a sky-to-green signal line with a light pulse running along it every few seconds (still for reduced motion), and the theme and Jump to buttons have sky outlines.
- Circuit: the ⌘K menu and the theme picker panel have a light sky border and a soft sky glow, so they stand out from the page.

## 1.12.0 — 2026-10-13

- New default theme, Circuit, based on my business card: ink-navy background with a dot grid, the card's circuit traces glowing in the corner, the `<EP/>` logo in sky blue with a green cursor, `//` before section headings, and the free consultation panel in the card's teal.
- Circuit makes The Lab and Posts stand out: Lab cards get a sky-to-green glowing edge and sky tech chips, section headings run into a circuit line, and posts hang off a teal trace like nodes (featured posts in teal, an arrow on hover); the Lab's page bars and arrow buttons are sky blue).
- The previous look is now the Minimalist theme (with System / Light / Dark), still one click away in the 🎨 picker. Anyone who had picked it keeps it.
- The theme is now set by the server too, so the page looks right even before JavaScript loads.

## 1.11.0 — 2026-10-13

- Site themes: a new 🎨 button in the header opens a theme panel with preview cards: Default, High contrast, Retro CRT (moved out of "Some fun") and Halloween (offered Oct 1 – Nov 1: midnight purple and pumpkin orange, bats flapping across the screen, a swaying skeleton, flickering jack-o'-lanterns in the corners and next to section headings; all still for reduced motion). Themes are also in the ⌘K menu.
- Light, dark or follow-the-device for the Default theme, chosen in the same panel.
- Your choice is remembered and applied before the page appears (no flash). From Oct 15, a one-time corner invitation suggests the Halloween theme.
- "Some fun" now has five effects (Confetti, Scuba, Skydive, Wave, Party) plus the secret Deep Drop mode.

## 1.10.1 — 2026-10-13

- Lint is now completely clean (no warnings): removed an unused Speed Insights import and documented why the homepage avatar uses a plain image (Sanity already optimizes it).

## 1.10.0 — 2026-10-09

- Sturdier when Sanity is slow or down: the header and footer load a small query of their own and fall back to built-in links; the homepage, posts, titles and other pages fall back to built-in content; a friendly error page (with "Try again") replaces crashes, plus a last-resort page if the whole layout fails; the build no longer fails if Sanity can't list the posts.
- Content changes show up straight away: publishing in Studio calls a Sanity webhook (`/api/revalidate`, signed with `SANITY_REVALIDATE_SECRET`) that refreshes every page; Sanity data is otherwise refreshed at least every 5 minutes.
- Lint and type check now pass cleanly (no `any` left), ready for automatic checks on GitHub.

## 1.9.6 — 2026-10-09

- The Lab moves on to the next set of experiments every 5 seconds (and back to the start after the last), with the current page's bar filling up as a countdown. It waits while the mouse is over it, while keyboard focus is inside it, for 8 seconds after a swipe, and while it's off screen or the tab is hidden.
- New pause/play button next to the arrows; no automatic movement at all for visitors who prefer reduced motion.

## 1.9.5 — 2026-10-08

- Easier to read in dark mode: the homepage bio and headline, the grey notes on the Performance and Tests pages, the contact form toggle, Read & Listen's voice note and the ⌘K menu now use lighter text on the dark background (every page passes the contrast check in light and dark).
- New "Readability" test that flags any faint grey text without a dark-mode colour, so this can't creep back in.

## 1.9.4 — 2026-10-08

- Lab cards can show a screenshot uploaded in Sanity ("Card image", with crop and focus point) instead of the drawn picture, so experiments on other sites look like the real thing.

## 1.9.3 — 2026-10-08

- The Lab can now show experiments that live on other sites (e.g. the HubSpot CMS version of this site): their cards open in a new tab, show a ↗ and can use a new "website" picture with the site's address.
- In Studio, a Lab experiment's address can be a page on this site ("/…") or a full https:// link.

## 1.9.2 — 2026-10-07

- More tests: test coverage is back above 90% (about 96% of lines, 326 tests), now including the fun mode animations, the AI Cost Case page, more contact form cases, every page's intro, the ⌘K menu's keyboard controls and the build step that saves the test results.

## 1.9.1 — 2026-10-07

- AI Cost Case: the page label now reads "AI cost case" instead of "Demo case".
- Bigger, clearer Before/After switch at the top of the AI Cost Case page; the pause button moved under the diagram.

## 1.9.0 — 2026-10-07

- New AI Cost Case (`/ai-cost-case`): a demo case study of a fictional company that wired AI agents between its CRM, CMS, marketing suite, store and help desk, and how a leaner design gets the same results for a fraction of the tokens and cost.
- Interactive before/after flow diagram with moving data (pausable, still for reduced motion); select any box to see what it does and what it costs.
- Where the money went, the four-step redesign, a box-by-box comparison, a sample weekly report, and a "Try your numbers" calculator that updates every number on the page; all assumptions are listed.
- New "AI Cost Case" card in The Lab, ⌘K menu entry with its own icon, sitemap entry and an "AI cost case" area on the tests page.

## 1.8.0 — 2026-09-29

- Fun mode rebuilt: "Some fun" now plays six named, site-wide effects in a shuffled order that never repeats back to back: Confetti (bursts from the logo), Scuba (bubbles and an ocean tint), Skydive (the page drops in while a parachutist drifts by), Retro (the whole site as the game's green screen), Wave (title letters ripple) and Party (rainbow headings).
- Secret "Deep Drop mode": type ↑↑↓↓←→←→EP anywhere to watch the site logo fall into the water and sink.
- The header pill shows the effect's name and seconds left, with Next and Stop buttons; screen readers hear which effect started.
- Calm versions for visitors who prefer reduced motion; the countdown pauses in background tabs, and the animation code only loads the first time it's needed.

## 1.7.0 — 2026-09-29

- New Project Scoping Assistant (`/scope`): seven quick questions and an optional note, then a project snapshot with size (S–XL), a week range, timeline fit, phases, "What moves the estimate", top risks, first steps and a suggested approach.
- The estimate comes from transparent rules; an AI-written summary (Gemini) rewords it and is rejected if it invents numbers, with a template summary as fallback.
- Snapshot actions: book a free consultation with the snapshot prefilled in the booking notes, copy a shareable link (answers only, never the note), save as PDF, start over.
- New "Project Scoping" card first in The Lab, ⌘K menu entry, sitemap entry, a link from the Services consultation section, and a "Project scoping" area on the tests page.

## 1.6.0 — 2026-09-29

- Free 30-minute technical consultation: a short invitation right after the homepage intro ("Book a Free Consultation" and "Explore My Services"), and its own section on the Services page.
- The booking button opens a Cal.com calendar as a popup on the site (Cal.com emails the invite to both people); other scheduling links open in a new tab, and without a link it opens the contact form.
- Services page: new "Why work with me" section. Page order: intro, services, free consultation, why work with me, contact banner.
- All texts and the booking link are edited in Sanity ("Free consultation" and the "Services page" document).

## 1.5.3 — 2026-09-28

- Read & Listen: when Google's model is overloaded ("high demand") or too slow, the page now tries a backup model (`gemini-3.1-flash-lite`, configurable with `GEMINI_FALLBACK_MODELS`) before falling back to the built-in library.
- Read & Listen: when the AI fails, the notice shows a short code for why (e.g. "http-503", "timeout", "max-tokens"), and the same code is logged; overloaded models get a "very busy right now" message.
- Each Gemini request now times out after 12 seconds (was 20) and allows longer answers.

## 1.5.2 — 2026-09-28

- Faster first paint on phones: the stylesheet is now inlined in the HTML instead of a separate render-blocking download.
- The monospace font used by the header logo is preloaded again, since it's needed for the first paint.
- Homepage photo is served as WebP/AVIF when supported and loaded with high priority.

## 1.5.1 — 2026-09-27

- The Lab's cards no longer prefetch their pages, which removes Chrome's "stylesheet preloaded but not used" console warning on the homepage (it was the game's retro font).

## 1.5.0 — 2026-09-27

- Homepage: new "The Lab" section after the intro, showing the site's experiments (Read & Listen, The Deep Drop, Performance, Tests) as a swipeable row of cards. Each card has a small preview, what it is, the question behind it and the tools used. The Tests card shows the latest real test numbers.
- The Lab's experiments are edited in Sanity ("Lab experiment"), with built-in defaults as a fallback.
- The row's page bars count scroll steps, not cards, and can be clicked to jump; arrows and bars hide when everything fits.

## 1.4.4 — 2026-09-27

- Read & Listen: new "Very slow" reading speed. Speeds are now Very slow (half speed, 2-second pause between sentences), Slow (¾ speed, 1-second pause) and Normal.

## 1.4.3 — 2026-09-27

- Read & Listen: the beta note now applies to the whole page (every topic, not only Conversation) and explains that voices can take a few seconds to start on some systems and languages.

## 1.4.2 — 2026-09-27

- Read & Listen: French, German and other languages start speaking faster. The page prefers each language's standard voice over the slow-loading macOS character voices, loads the voice ahead of time, and shows a spinner while it starts.
- Read & Listen: AI texts with a sentence in another alphabet (e.g. Korean inside English) are rejected and asked for again, and the AI is told to stay strictly in the two chosen languages. Previously saved AI texts are cleared.

## 1.4.1 — 2026-09-27

- The Deep Drop's retro terminal font is no longer preloaded, which removes Chrome's "preloaded but not used" console warning.

## 1.4.0 — 2026-09-27

- New Read & Listen page (`/read-listen`): short texts in two languages side by side (Spanish, English, French, Portuguese, Italian, German), from beginner (A1) to proficient (C2), with read-aloud using the browser's voices. New texts are written by AI (Google Gemini), with a built-in library as backup.
- Conversation topic (beta): two-person dialogues with a different voice for each speaker.
- When the AI's free usage limit is reached, the page pauses the AI and explains why a built-in text is shown.
- Read-aloud plays one sentence at a time so it doesn't stop partway through a conversation.
- Headphones icon in the menu, sitemap entry, and a "Read & Listen" area on the tests page.

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

# estebanpayret.com

The source code for my personal website, [estebanpayret.com](https://www.estebanpayret.com). It's built with Next.js and gets its content from Sanity CMS. The Sanity Studio lives in a separate repository (`studio-mysite`).

## What's on the site

| Page | What it does |
| --- | --- |
| `/` | Intro, a "Let's Work Together" contact form, the latest posts and the site log as sticky notes |
| `/services` | Services managed in Sanity; clicking one opens the contact form about that service |
| `/posts` and `/<slug>` | All posts, and each post's page |
| `/site-log` | Behind-the-scenes notes from building the site |
| `/performance` | Runs a live Lighthouse test through Google PageSpeed Insights |
| `/tests` | Runs this project's test suite and shows the results and code coverage |
| `/adventure` | *The Deep Drop*, a small skydiving and cave-diving text adventure |

Other features: a ⌘K / Ctrl+K command menu, a site-wide "fun mode", a 404 page, a sitemap and robots.txt, and the site version in the footer.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) with the Typography plugin
- [Sanity](https://www.sanity.io) for content (posts, profile, links, services, site log)
- [Resend](https://resend.com) for sending contact form emails
- [Vitest](https://vitest.dev) and Testing Library for tests
- Hosted on [Vercel](https://vercel.com)

## Getting started

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Content is read from the Sanity project `w8am8n9g` (dataset `production`), so the site works right away without any setup.

### Environment variables

Create a `.env.local` file in the project root (it's git-ignored). All variables are optional locally (without them, the contact form prints emails to the console instead of sending), but add them in Vercel for production:

| Variable | Used for |
| --- | --- |
| `PAGESPEED_API_KEY` | Google PageSpeed Insights key for the performance page. Without it, Google's shared quota usually runs out. |
| `RESEND_API_KEY` | Sends contact form emails. Without it (in development), the email is printed to the console instead. |
| `CONTACT_TO_EMAIL` | Where contact form messages go. Required for the form to send in production; kept out of the code so the address isn't public. |
| `CONTACT_FROM_EMAIL` | The sender address; it must be on a domain verified in Resend. |
| `NEXT_PUBLIC_SITE_URL` | Overrides the site address used for the sitemap and robots.txt (defaults to `https://www.estebanpayret.com`). |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Runs the tests (saving the results for `/tests`), then builds the site |
| `npm start` | Serves the production build |
| `npm run lint` | Checks the code with ESLint |
| `npm test` | Runs all tests once |
| `npm run test:watch` | Re-runs tests as files change |
| `npm run test:coverage` | Runs the tests with a coverage report (summary in the terminal, full report in `coverage/index.html`) |

## Project structure

```text
src/
  app/          Pages, layout, API routes and page-specific components
    _home/      Homepage sections (posts, site log notes)
    api/        Route handlers: contact form, performance test, live test runs
  lib/          Data loading, helpers and shared logic (contact form, PageSpeed, the adventure game)
  sanity/       Sanity client and GROQ queries
scripts/        Captures test results (and coverage) for the /tests page
public/         Static files
```

## Content

Posts, the profile, menu links, services and site log notes are edited in Sanity Studio (the `studio-mysite` repository). Pages pick up changes automatically, usually within a minute (individual post pages within an hour), so there's no need to redeploy after editing content.

## Tests

Tests live next to the code they cover, in `__tests__` folders. On the live site, `/tests` shows the results saved when the site was built. In `npm run dev`, the button runs the suite live.

When you add tests for a new part of the site, add it to the areas in `src/lib/testGroups.ts` so the results are grouped properly on the `/tests` page.

## Releases

The site follows [semantic versioning](https://semver.org). The version in `package.json` is shown in the footer, and every release is listed in [CHANGELOG.md](CHANGELOG.md) with a matching `vX.Y.Z` git tag.

## Deployment

Every push to `main` deploys to Vercel automatically.

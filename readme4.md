# Lab — Adding End-to-End Tests (Playwright)

So far every check has been manual: start the app, click around, see if it
works. This lab automates that. We use **Playwright** to drive a real browser
through the app — filling forms, clicking links, reading the page — and to
**assert** that the right things happen. These are **end-to-end (E2E)** tests:
they exercise the whole stack (browser → Next.js → server action → Prisma →
Postgres), exactly as a user would.

**What we test:** navigation between pages, the tickets list search/filter,
creating a ticket, replying to a ticket, and the 404 page. The app has no login,
so tests just navigate straight to any page.

> Prerequisite: the database lab (`readme3.md`) is done and **Docker Postgres is
> running** — the pages read live from the DB, so the tests need it up.

---

## Part A — Setup (run once)

| # | Command | What it does / means |
|---|---------|----------------------|
| 1 | `docker compose up -d` | Start Postgres (same as the DB lab). The tests can't run without it. |
| 2 | `npm i -D @playwright/test` | Installs the Playwright test runner as a **dev dependency** (test-only, not shipped). |
| 3 | `npx playwright install` | Downloads the actual **browser binaries** (Chromium) Playwright drives. One-time, ~hundreds of MB. |
| 4 | `npm run test:e2e` | Run all tests headless (no visible window). Playwright **auto-starts the dev server** and reseeds the DB first. |
| 5 | `npm run test:e2e:ui` | Open **UI mode** — a visual runner where you watch each step, time-travel, and re-run single tests. Best for learning/debugging. |
| 6 | `npm run test:e2e:report` | Open the HTML report from the last run (passes/failures, traces, screenshots). |

> The first run also creates `test-results/` and `playwright-report/`. These are
> generated output and are git-ignored.

---

## Part B — What changed & what it means

### New files
| File | What it is |
|------|-----------|
| `playwright.config.js` | Central config: where tests live (`e2e/`), the `baseURL`, which browser, the `webServer` block, and `globalSetup`. |
| `e2e/global-setup.js` | Runs **once** before all tests. Re-runs `npm run db:seed` so every run starts from the same 8 known tickets. |
| `e2e/navigation.spec.js` | Clicks each sidebar link; checks the URL + heading for every page. |
| `e2e/tickets-list.spec.js` | Searches/filters the ticket list; checks the empty state and the count footer. |
| `e2e/create-ticket.spec.js` | Fills the New-ticket form, submits, checks the redirect to the new ticket. |
| `e2e/ticket-reply.spec.js` | Opens a seeded ticket, checks the disabled AI panel, posts a reply. |
| `e2e/not-found.spec.js` | Visits a missing id; checks the 404 status + page. |

### Modified files
| File | Change | Why |
|------|--------|-----|
| `package.json` | Added `@playwright/test` + `test:e2e*` scripts. | Short commands to run the suite. |
| `.gitignore` | Ignore `test-results/`, `playwright-report/`. | Generated output shouldn't be committed. |

### How a test run works
1. **`globalSetup`** runs → reseeds the DB → deterministic starting data.
2. **`webServer`** boots `npm run dev` (or reuses one already on `:3000`) and
   waits until `http://localhost:3000` responds.
3. Each **spec** opens a browser page, drives the UI (`goto`, `click`, `fill`),
   and makes **assertions** (`expect(...).toBeVisible()`).
4. Playwright shuts the server down and writes the report.

---

## Concepts explained

- **E2E vs unit test.** A *unit* test checks one function in isolation. An *E2E*
  test drives the whole running app in a browser — slower, but it proves the
  pieces actually work together (routing, forms, DB writes).
- **Locators** (`getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`). How
  Playwright finds an element. We prefer these **user-facing** locators over CSS
  classes because they match what a user/screen-reader sees, and they don't
  break when you restyle. (This app has no `data-testid`s, so we lean on roles
  and labels.)
- **Assertions & auto-waiting.** `expect(locator).toBeVisible()` doesn't check
  once and give up — Playwright **retries until it passes or times out**. That's
  why you rarely need manual "sleep" calls: it waits for the redirect, the DB
  write, the re-render.
- **`webServer`.** Config that tells Playwright to start (and stop) your app for
  you, so you don't have to run `npm run dev` in a second terminal.
- **Global setup / fixtures.** Setup that runs before tests. We use it to reset
  the database. (A *fixture* is Playwright's per-test version of the same idea —
  e.g. the `page` object each test receives.)
- **Headless vs headed.** *Headless* = no visible window (fast, default, what CI
  uses). *Headed* / **UI mode** = you watch the browser — great for debugging.
- **Trace viewer.** A trace is a step-by-step recording (DOM snapshots, network,
  console) captured on failure. Open it from the HTML report to see exactly what
  the page looked like when a step failed.
- **Flakiness & determinism.** A "flaky" test passes/fails randomly — usually
  from unpredictable data or timing. We avoid it by **reseeding the DB** (known
  data) and by using unique values (e.g. a timestamped subject) in write tests.

---

## Key concepts (docs)
- Playwright intro & install — https://playwright.dev/docs/intro
- Writing tests / assertions — https://playwright.dev/docs/writing-tests
- Locators (role, label, text) — https://playwright.dev/docs/locators
- `webServer` config — https://playwright.dev/docs/test-webserver
- Global setup & teardown — https://playwright.dev/docs/test-global-setup-teardown
- UI mode — https://playwright.dev/docs/test-ui-mode
- Trace viewer — https://playwright.dev/docs/trace-viewer-intro

> Note: the suite **reseeds your dev database** on every run (via
> `npm run db:seed`), which wipes and reloads the sample tickets. Don't run it
> against data you care about — it's meant for the lab/dev DB.

---

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `Can't reach database server at localhost:5432` | Postgres isn't up: `docker compose up -d`; check `docker compose ps`. |
| `browserType.launch: Executable doesn't exist…` | Browsers not installed: `npx playwright install`. |
| `Timed out waiting … web server` / port 3000 busy | Something else is on `:3000`. Stop it, or let Playwright reuse it — leave `npm run dev` running before the tests. |
| A test times out on an element | Check the locator name matches the visible text/label; open `npm run test:e2e:ui` to see where it got stuck. |
| Reply/new-ticket test fails on a rerun | Make sure the seed ran (it's automatic in `global-setup`, but needs the DB up). |

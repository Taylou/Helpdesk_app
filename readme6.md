# Lab — CI/CD + Deploying Live (GitHub Actions + Render)

Every lab so far has run on **your machine**: `npm run dev`, a Docker Postgres,
tests against `localhost`. This lab puts the app **on the internet**. Two pieces:

- **CI (Continuous Integration)** — every push runs the tests automatically on
  GitHub's servers (lint, build, Playwright E2E, a k6 API smoke test). If you break
  something, you find out in minutes, not in production.
- **CD (Continuous Deployment)** — when the tests pass on `main`, the app deploys to
  **Render**, a hosting platform, and you get a **public URL** you can share.

By the end you'll push a commit and watch it flow: **GitHub → tests → live site.**

> Prerequisite: the earlier labs work locally (`npm run dev` + Docker Postgres), and
> you have a **GitHub account** with this repo pushed, plus a free **Render account**
> (sign up with your GitHub login — https://render.com). Render provisions the
> production database for you; you don't need Docker in the cloud.

---

## Part 0 — Getting this lab's code

Same as before (see readme5's Part 0). This lab adds files and **one** new
convenience script; it changes no dependencies, so there's nothing to install
beyond `npm install`.

**Git users:** `git pull origin main` (or your lab branch).
**ZIP users:** copy in the new files below, keep your own `.env` / `node_modules`.

| New / changed this lab | |
|---|---|
| `render.yaml` | Render Blueprint — provisions Postgres + the web service. |
| `.github/workflows/ci.yml` | The CI/CD pipeline. |
| `app/api/health/route.js` | Health check endpoint Render polls. |
| `prisma/seed-if-empty.mjs` | Seeds sample data **only if the DB is empty** (safe for deploys). |
| `package.json` | **modified** — added `db:seed:prod`, `db:migrate:deploy`, `render-build`. |
| `readme6.md` | this guide. |

---

## Part A — Deploy it live (run once)

The order matters: **push your code first**, then point Render at it.

| # | Where | Step |
|---|-------|------|
| 1 | terminal | Make sure everything is committed and on GitHub's `main` branch: `git push origin main`. (Render deploys from `main`.) |
| 2 | render.com | Sign in with GitHub. Click **New ➜ Blueprint**. |
| 3 | Render | Pick this repository. Render finds `render.yaml` and shows the plan: **one Postgres database + one web service**. Click **Apply**. |
| 4 | Render | Render now **provisions Postgres**, runs the **build** (`npm ci && npm run render-build` — this applies migrations and seeds the 8 sample tickets), then **starts** the app. Watch the live build log. First build takes a few minutes. |
| 5 | Render | When the service shows **Live**, click its URL (`https://helpdesk-app-XXXX.onrender.com`). Your app is on the internet. Try `/api/tickets` and `/api/health` too. |
| 6 | terminal | Make a visible change (edit a heading), `git commit` and `git push`. Render **auto-deploys** the new commit — watch it redeploy and refresh the URL. |

That's CD: push ➜ live. Part B turns on the CI tests that guard it.

> **Free-tier reality:** a free web service **sleeps after ~15 min idle**, so the
> first visit after a while takes ~30 s to cold-start — then it's fast. Free
> Postgres is deleted ~30 days after creation; for a long-lived demo, upgrade the
> database or recreate the blueprint.

---

## Part B — Turn on CI (the test gate)

The workflow in `.github/workflows/ci.yml` runs the moment you push — no setup
needed. GitHub spins up a throwaway Ubuntu machine **and a Postgres container**,
then runs three jobs:

| Job | What it does |
|-----|--------------|
| **build-and-smoke** | `npm ci` ➜ migrate ➜ lint ➜ **build** ➜ seed ➜ start the **production** server ➜ **k6 smoke test** against the REST API. Proves the thing you're about to deploy actually works. |
| **e2e** | Installs a browser and runs the **Playwright** UI tests against the app. |
| **deploy** | Runs **only on `main`, only if the two test jobs pass.** See below. |

Open the **Actions** tab in your GitHub repo after a push to watch them run
(green ✓ / red ✗). A failing job blocks the deploy.

### Wiring the deploy — pick one

**Option A — Render auto-deploy (simplest, the default).**
`render.yaml` has `autoDeploy: true`, so Render redeploys on every push to `main`
on its own. The `deploy` job in CI detects there's no deploy hook and simply
no-ops. Nothing else to do. *Downside: Render deploys even if CI is red* — the
tests are informational.

**Option B — CI-gated deploy (recommended: deploy only if green).**
Make the deploy wait for passing tests:

1. In Render: open the web service ➜ **Settings** ➜ set **Auto-Deploy** to **No**
   (or change `autoDeploy: false` in `render.yaml` and push).
2. In Render: **Settings ➜ Deploy Hook** ➜ copy the URL.
3. In GitHub: repo **Settings ➜ Secrets and variables ➜ Actions ➜ New repository
   secret**. Name it `RENDER_DEPLOY_HOOK_URL`, paste the URL.
4. Done. Now the `deploy` job fires the hook **only after `build-and-smoke` and
   `e2e` pass on `main`** — a red build never reaches production.

---

## Part C — What changed & what it means

### New files
| File | What it is |
|------|-----------|
| `render.yaml` | **Blueprint** (infrastructure-as-code): declares the Postgres DB and the web service — build command, start command, health check, and the `DATABASE_URL` wiring — so the whole stack is reproducible from one file. |
| `.github/workflows/ci.yml` | The **pipeline**: which jobs run, in what order, on which events. |
| `app/api/health/route.js` | `GET /api/health` ➜ `{ status, db, time }`. Always 200 so a DB blip doesn't kill the process; Render uses it as the `healthCheckPath`. |
| `prisma/seed-if-empty.mjs` | Wraps the normal seed with an "only if the DB has no tickets" guard — so a redeploy never wipes real data. |

### Modified files
| File | Change | Why |
|------|--------|-----|
| `package.json` | Added `db:migrate:deploy`, `db:seed:prod`, and `render-build` (`migrate deploy && seed-if-empty && next build`). | One tidy build command for Render; safe production seeding. |

### How a deploy flows
```
git push origin main
      │
      ▼
GitHub Actions ──► build-and-smoke ─┐
                └─► e2e ────────────┴─► (both green?) ─► deploy job ─► Render
                                                                        │
                    Render: npm ci → migrate deploy → seed-if-empty →   │
                            next build → next start → health check ✓ ──►│  LIVE URL
```

---

## Concepts explained

- **CI vs CD.** *Continuous Integration* = automatically build and test every
  change. *Continuous Deployment* = automatically ship changes that pass. CI catches
  bugs; CD removes the manual "now upload it somewhere" step.
- **Pipeline / workflow / job / step.** A **workflow** (`ci.yml`) is a set of
  **jobs**; each job runs on a fresh machine and is a list of **steps** (commands or
  reusable actions). Jobs run in parallel unless one `needs` another.
- **Runner.** The throwaway VM GitHub gives you (`runs-on: ubuntu-latest`). It starts
  clean every run — which is why the tests install everything from scratch.
- **Service container.** The `services: postgres:` block boots a real Postgres next
  to the job, so the tests run against a database just like production — no mocks.
- **Migrate vs migrate deploy.** `prisma migrate dev` is for **development** (it can
  create/rename migrations and reset). `prisma migrate deploy` just **applies**
  existing migrations — safe and non-interactive, the right one for CI and prod.
- **Build-time vs run-time.** Render runs `render-build` on a build box, then
  `next start` on the web box. Migrations run at **build** (the DB is reachable
  then); the pages render at **run-time** per request.
- **Blueprint / infrastructure-as-code.** `render.yaml` describes the infrastructure
  in version control, so the environment is reproducible and reviewable — not a pile
  of dashboard clicks nobody remembers.
- **Health check.** A URL the platform pings to decide if an instance is ready for
  traffic (and to restart it if it goes unhealthy). Ours reports DB status but stays
  200 for liveness.
- **Secrets.** Credentials (like the deploy hook) that must not live in the repo.
  GitHub stores them encrypted and injects them into the run as `${{ secrets.X }}`.
- **Deploy hook.** A private URL that, when POSTed to, tells Render to deploy. It's
  how CI hands off to CD in the gated setup.
- **Environment variables.** `DATABASE_URL` isn't hardcoded — locally it comes from
  `.env`, in CI from the workflow, in production from Render's database. Same code,
  different config per environment.
- **Cold start / sleeping.** Free instances stop when idle and take a few seconds to
  wake — fine for a demo, something you'd pay to avoid in production.

---

## Key concepts (docs)
- GitHub Actions — https://docs.github.com/actions
- Workflow syntax — https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
- Service containers (Postgres) — https://docs.github.com/actions/using-containerized-services/creating-postgresql-service-containers
- Encrypted secrets — https://docs.github.com/actions/security-guides/using-secrets-in-github-actions
- Render Blueprints (`render.yaml`) — https://render.com/docs/blueprint-spec
- Render + Node/Next.js — https://render.com/docs/deploy-nextjs-app
- Render deploy hooks — https://render.com/docs/deploy-hooks
- Prisma `migrate deploy` — https://www.prisma.io/docs/orm/prisma-migrate/workflows/production-and-testing

> Note: the CI runs the **same** commands you run locally (`npm run build`,
> `test:e2e`, `k6 run k6/smoke.js`). If it passes locally with a clean checkout, it
> passes in CI — that's the whole point.

---

## Troubleshooting
| Problem | Fix |
|---------|-----|
| Render build fails at `prisma migrate deploy` | The web service can't see the DB. Confirm `DATABASE_URL` is wired via `fromDatabase` in `render.yaml` and the DB and web service share a **region**. |
| Live site loads but shows no tickets | The seed didn't run (DB wasn't empty, or seed errored). Open the Render **Shell** and run `npm run db:seed`, or check the build log. |
| Live site is a "502 / still spinning up" | Free instance cold-starting after idle — wait ~30 s and refresh. |
| Health check keeps failing on Render | Make sure the service listens on Render's `$PORT` (it does — `next start` reads it) and `healthCheckPath` is `/api/health`. Check the logs for a crash. |
| CI `build-and-smoke` fails at k6 install | The pinned k6 version download 404'd — bump `K6VER` in `ci.yml` to a current release from https://github.com/grafana/k6/releases. |
| CI `e2e` job times out starting the server | Ensure migrations ran (`db:migrate:deploy`) and `DATABASE_URL` points at the `postgres` service; the job sets both. |
| Push to `main` didn't deploy | Option A: check Render **Auto-Deploy** is On. Option B: check the `RENDER_DEPLOY_HOOK_URL` secret exists and the `deploy` job ran green in the **Actions** tab. |
| Don't want to deploy every branch | The `deploy` job already guards `if: github.ref == 'refs/heads/main'`; pushes to `Dev` only run the tests. |

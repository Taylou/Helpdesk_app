# Lab — REST API + Load Testing (K6)

So far the app has had exactly one way to change data: **Server Actions** — the
functions a `<form>` calls on submit (`app/actions/tickets.js`). That's convenient,
but it's tied to *this* app's forms on the *same* origin. This lab adds a **REST
API**: a plain HTTP + JSON boundary that **any** client — `curl`, another service,
or a load generator — can call. Then we point **K6** at it to **benchmark** it:
spin up many concurrent virtual users, measure latency and error rates, assert
those stay within limits, and finally **watch it live on dashboards**.

**What we build:** a tickets API (list, create, read-one, update, delete, reply),
a **suite of five k6 tests** (smoke, load, CRUD, stress, spike), and **two ways to
see the numbers** — k6's built-in web dashboard, and a Prometheus + Grafana stack.

> Prerequisite: the database lab (`readme3.md`) is done and **Docker Postgres is
> running** — the API reads/writes live from the DB. k6 hits the **running app**, so
> the dev server must be up too (`npm run dev`).

---

## Part 0 — Getting this lab's code

You're continuing from the Playwright lab (`readme4.md`). Here's how to pull this
lab's changes into the copy you already have.

> **Good news for both paths:** this lab adds **no new npm packages** (k6 is a
> standalone binary) and **no database changes** (`schema.prisma` is untouched). So
> there's **no migration to run** — you just need the new files.

### If you track the repository with Git

```bash
# 1. Save any experiments you don't want to lose.
git status                 # see what you've changed
git stash                  # park local changes (or: git commit -m "my notes")

# 2. Get the latest from GitHub.
git fetch origin
git pull origin main       # this repo also has `Dev` and `features` branches —
                           # use whichever one your labs live on

# 3. Bring your changes back (skip if you didn't stash).
git stash pop              # resolve conflicts if it complains
```

Then jump to **Part A**, step 1.

| Problem | Fix |
|---------|-----|
| `Your local changes would be overwritten` | `git stash` first, pull, then `git stash pop`. |
| Merge conflict in `package.json` | Keep **both** sets of `scripts`, then `npm install`. |
| You want a clean slate | `git stash` (safety), then `git checkout -- .` to discard local edits. |

### If you work from a downloaded ZIP

Download the new ZIP and unpack it somewhere **separate** — don't extract it on
top of your existing folder, or you'll inherit stale files. Then copy across:

| Copy in (new / changed this lab) | |
|---|---|
| `app/api/tickets/` | the whole folder — 3 new route files |
| `k6/` | the whole folder — the test suite |
| `monitoring/` | the whole folder — Prometheus + Grafana config |
| `docker-compose.monitoring.yml` | the optional dashboards stack |
| `lib/tickets.js` | **modified** — gained the raw REST helpers |
| `package.json` | **modified** — gained the `bench:*` / `monitor:*` scripts |
| `.gitignore` | **modified** — ignores benchmark output |
| `readme5.md` | this guide |

| Keep YOUR copy — never overwrite | Why |
|---|---|
| `.env` | your `DATABASE_URL`. The ZIP won't contain it. |
| `.env.local` | your Ollama/AI settings from the earlier lab. |
| `node_modules/` | don't copy it; run `npm install` instead. |
| `prisma/migrations/` | yours already match your database. |

Then run `npm install` once (it re-runs `prisma generate`) and continue to **Part A**.

> **How to tell it worked:** `npm run bench:smoke` should pass. If you get
> `Cannot find module './lib/api.js'`, the `k6/lib/` subfolder didn't come across.

---

## Part A — Setup (run once)

| # | Command | What it does / means |
|---|---------|----------------------|
| 1 | `winget install --id GrafanaLabs.k6 -e` | Installs **k6** (a standalone binary — *not* an npm package). macOS: `brew install k6`. Others: https://grafana.com/docs/k6/latest/set-up/install-k6/. |
| 2 | `k6 version` | Confirms k6 is on your `PATH`. Reopen the terminal if "not recognized". |
| 3 | `docker compose up -d` | Start Postgres (same as the DB lab). |
| 4 | `npm run db:seed` | Reset to the 8 known sample tickets, so runs start from a known state. |
| 5 | `npm run dev` | Start the app **in its own terminal** — leave it running. k6 calls this live server. |
| 6 | `curl http://localhost:3000/api/tickets` | Sanity-check the API returns a JSON array before load-testing. |
| 7 | `npm run bench:smoke` | **Always run this first.** Walks every endpoint once — fails in seconds if something's broken. |
| 8 | `npm run bench` | The baseline **load test** (~80s). Prints a summary and passes/fails on thresholds. |

---

## Part B — The test suite

Five scripts, each answering a different question. They share one helper module,
`k6/lib/api.js`, which wraps every endpoint with its request **and** its checks —
so each test file only describes its *load shape*.

| Command | Script | Question it answers |
|---------|--------|---------------------|
| `npm run bench:smoke` | `k6/smoke.js` | **Does it work at all?** 1 user, 3 iterations. Walks the full lifecycle (create → read → update → reply → delete) plus the 404/400 error cases. Correctness, not speed. |
| `npm run bench` | `k6/tickets-load.js` | **Is it fast enough at expected traffic?** ~80% reads / ~20% writes, ramping to 10 users. The baseline benchmark. |
| `npm run bench:crud` | `k6/tickets-crud.js` | **Do the writes hold up?** Every iteration runs a full lifecycle, so `PATCH`, `DELETE` and the messages endpoint get load too. Deletes what it creates, so the DB stays clean. |
| `npm run bench:stress` | `k6/stress.js` | **Where does it break?** Steps up to 40 users to find the ceiling. Reads only. Expect it to hurt — that's the point. |
| `npm run bench:spike` | `k6/spike.js` | **What if traffic arrives all at once?** Jumps from 2 to 50 requests/sec in 5s, then watches whether it *recovers*. |

Every script takes overrides:

```bash
k6 run -e VUS=20 k6/tickets-load.js          # more virtual users
k6 run -e BASE_URL=http://localhost:3001 ...  # a different target
k6 run -e RPS=100 k6/spike.js                 # a bigger spike
```

> ⚠️ `bench` and `bench:crud` **write to the database**. `bench:crud` cleans up
> after itself; `bench` leaves its created tickets behind. Run `npm run db:seed`
> to reset.

---

## Part C — Seeing the metrics

The terminal summary is fine for pass/fail, but it only shows the *end* result.
Dashboards show you the shape over time — the moment latency starts climbing.

### Option 1 — k6's built-in web dashboard (no extra setup)

| Command | What you get |
|---------|--------------|
| `npm run bench:dash` | Opens a **live** dashboard at **http://localhost:5665** while the test runs. Watch the curves move. |
| `npm run bench:report` | Writes a **self-contained** `k6/report.html` you can open later or share — no server needed. |

### Option 2 — Prometheus + Grafana (the real monitoring stack)

| # | Command | What it does |
|---|---------|--------------|
| 1 | `npm run monitor:up` | Starts Prometheus (:9090) + Grafana (:3001) from `docker-compose.monitoring.yml`. |
| 2 | `npm run bench:prom` | Runs the load test, **pushing** metrics to Prometheus as it goes. |
| 3 | open **http://localhost:3001** | Grafana. The **k6 — Helpdesk API** dashboard is already there (no login, no setup). |
| 4 | `npm run monitor:down` | Stop the stack when you're done. |

Grafana is on **3001**, not 3000 — the Next.js dev server already owns 3000.

The dashboard shows: total requests, peak VUs, failed-request %, checks passing,
throughput per endpoint, p99 latency per endpoint, the VU ramp, and iterations/sec.
Because the data lands in Prometheus, it **persists after the run** — you can
compare today's run with yesterday's.

> **Want p95 as well as p99?** k6 only exports `p(99)` over remote write by
> default. Ask for more before running:
> ```powershell
> $env:K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99),avg,max"   # PowerShell
> ```
> ```bash
> export K6_PROMETHEUS_RW_TREND_STATS="p(95),p(99),avg,max" # bash
> ```

---

## Part D — What changed & what it means

### New files
| File | What it is |
|------|-----------|
| `app/api/tickets/route.js` | Collection endpoint. `GET` lists (query: `status`, `q`, `take`); `POST` creates → `201`. |
| `app/api/tickets/[id]/route.js` | Item endpoint. `GET` → `200`/`404`; `PATCH` → `200`/`400`/`404`; `DELETE` → `204`/`404`. |
| `app/api/tickets/[id]/messages/route.js` | Nested resource. `POST` adds a reply → `201`/`400`/`404`. |
| `k6/lib/api.js` | Shared request+check wrapper for every endpoint. The other scripts import it. |
| `k6/smoke.js`, `k6/tickets-load.js`, `k6/tickets-crud.js`, `k6/stress.js`, `k6/spike.js` | The five tests from Part B. |
| `docker-compose.monitoring.yml` | Optional Prometheus + Grafana stack. Separate file so the DB lab's `docker compose up -d` stays small. |
| `monitoring/prometheus.yml` | Prometheus config. |
| `monitoring/grafana/provisioning/…` | Auto-creates the data source + loads the dashboard on boot. |
| `monitoring/grafana/dashboards/k6-helpdesk.json` | The k6 dashboard itself. |

### Modified files
| File | Change | Why |
|------|--------|-----|
| `lib/tickets.js` | Added **raw** helpers: `listTicketsRaw`, `getTicketRaw`, `createTicket`, `updateTicket`, `deleteTicket`, `addMessage`. | Route handlers need machine-readable data (ISO dates), not the UI's "10m ago" formatting. The existing formatted functions are untouched. |
| `package.json` | Added `bench:*` and `monitor:*` scripts. | Short commands. No new dependencies — k6 is external. |
| `.gitignore` | Ignore `k6/report.html`, `k6/summary.json`. | Generated output shouldn't be committed. |

> **Server Actions stay as-is on purpose.** The REST API is a *second* boundary
> sitting on the *same* `lib/tickets.js` data layer — the forms still use actions;
> external clients use REST.

### How a request works
Client (`curl`/k6/browser) → **route handler** in `app/api/tickets/*` → helper in
`lib/tickets.js` → **Prisma** → **Postgres** → JSON response. No page render, no
`revalidatePath` — a REST client just wants the data back.

### How a benchmark run works
1. k6 reads `options` and **ramps virtual users** up/down over time.
2. Each VU loops the default function (an **iteration**), calling the helpers.
3. Every response is wrapped in a **`check`** (status code, shape).
4. Metrics stream to the terminal, and (optionally) to the web dashboard or
   Prometheus as the run happens.
5. At the end k6 evaluates the **`thresholds`**. If any fails, k6 **exits
   non-zero** — so CI can gate on it.

---

## Concepts explained

- **REST & HTTP verbs.** REST models data as **resources** at URLs (`/api/tickets`,
  `/api/tickets/5`) and uses the HTTP **method** to say what to do: `GET` (read),
  `POST` (create), `PATCH` (partial update), `DELETE` (remove).
- **Status codes.** `200` OK, `201` Created, `204` No Content (successful delete),
  `400` Bad Request, `404` Not Found, `500` server error. A client reads the code,
  not just the body.
- **Idempotency.** `GET`, `PATCH` and `DELETE` can be repeated with the same end
  state; `POST` creates a **new** row each time — which is why write load grows the
  table.
- **Route handlers vs Server Actions.** Both run on the server. An **action** is
  called by a form on the same site and can trigger a re-render. A **route handler**
  is a generic HTTP endpoint — any client, any language. Same data layer underneath.
- **Virtual users (VUs) & iterations.** A **VU** is one simulated concurrent user
  running the script in a loop. One loop = one **iteration**.
- **Stages / ramping.** Rather than constant load, **ramp** up, hold, then down —
  closer to real traffic, and it shows how latency changes as load rises.
- **Arrival rate vs VUs.** `stages` fix the *number of users*; the
  `ramping-arrival-rate` executor (used in `spike.js`) fixes the *request rate* and
  lets k6 add VUs to keep up. The second models "N users showed up per second" better.
- **`check` vs `threshold`.** A **check** is a per-request assertion that records
  pass/fail but **doesn't stop the run**. A **threshold** is a rule over a whole
  **metric** (e.g. `p(95)<2000`) that sets the **exit code** — that's what gates CI.
- **Expected errors.** k6 counts any non-2xx as a failed request. Our smoke test
  *wants* a 404/400, so it marks those with `expectedStatuses` — otherwise correct
  behaviour would look like a 25% failure rate.
- **Cardinality & URL grouping.** Tagging metrics with the full URL would make
  `/api/tickets/1`, `/api/tickets/2`… separate time series — thousands of useless
  series that bloat Prometheus. `k6/lib/api.js` passes an explicit `name` tag
  (`/api/tickets/:id`) so they group into one.
- **p95 / p99 latency.** The 95th/99th percentile: 95% (or 99%) of requests were
  faster than this. More honest than an average, which a few fast requests flatter.
- **Throughput.** Requests per second — how much work the API handled. Load tests
  trade throughput against latency.
- **Smoke / load / stress / spike.** Increasing severity: does it work → is it fast
  enough → where does it break → can it survive and *recover from* a surge.
- **Dropped iterations.** With an arrival-rate executor (`spike.js`), k6 aims for a
  fixed request rate. If the app can't keep up and k6 hits its `maxVUs` ceiling, it
  reports `dropped_iterations` — work it *wanted* to send but couldn't. A large
  number is itself a finding: the system can't sustain that arrival rate.
- **Push vs pull (remote write).** Prometheus normally **scrapes** targets on a
  timer. An 80-second load test is too short-lived for that, so k6 **pushes** via
  the *remote write* protocol instead.
- **Units gotcha.** k6's terminal summary prints durations in **milliseconds**, but
  the Prometheus output converts them to **seconds** (Prometheus convention). A p99
  of `0.35` in Grafana is 350ms.

---

## Key concepts (docs)
- Next.js Route Handlers — https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- HTTP request methods (MDN) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
- HTTP response status codes (MDN) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- k6 — get started — https://grafana.com/docs/k6/latest/
- k6 — test types (smoke/load/stress/spike) — https://grafana.com/docs/k6/latest/testing-guides/test-types/
- k6 — options & stages — https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
- k6 — thresholds — https://grafana.com/docs/k6/latest/using-k6/thresholds/
- k6 — checks — https://grafana.com/docs/k6/latest/using-k6/checks/
- k6 — scenarios & executors — https://grafana.com/docs/k6/latest/using-k6/scenarios/
- k6 — web dashboard — https://grafana.com/docs/k6/latest/results-output/web-dashboard/
- k6 — Prometheus remote write — https://grafana.com/docs/k6/latest/results-output/real-time/prometheus-remote-write/
- Prometheus — remote write receiver — https://prometheus.io/docs/prometheus/latest/feature_flags/
- Grafana — provisioning — https://grafana.com/docs/grafana/latest/administration/provisioning/

> Note: the load tests **write to your dev database**. Re-run `npm run db:seed`
> afterward to clear the test tickets. Don't run them against data you care about.

---

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `k6: command not found` / not recognized | Not installed or not on `PATH`: re-run the install, then **reopen the terminal** and `k6 version`. |
| `Cannot find module './lib/api.js'` | The `k6/lib/` subfolder is missing — see Part 0 (ZIP users especially). |
| `dial: connection refused` / all checks fail | The dev server isn't running, or `BASE_URL` is wrong. Start `npm run dev`. |
| `Can't reach database server at localhost:5432` (in the app log) | Postgres isn't up: `docker compose up -d`; check `docker compose ps`. |
| `http_req_duration` threshold fails | Your machine is slower than the target — lower `VUS` (`-e VUS=5`) or raise the threshold in the script. These are **dev-server** numbers; a production build is far faster. First-hit compile is slow, so run `bench:smoke` once to warm up. |
| `http_req_failed` fails on a test that "passed" | Something really did return a non-2xx. Deliberate error cases need `expectedStatuses` (see `k6/lib/api.js`). |
| `bench:report` made no `k6/report.html` | The run was too short for k6 to build a report ("not enough data"). Let the full ~80s test run rather than cutting it with `-e DURATION=10s`. |
| Grafana shows "No data" | Run a test with `npm run bench:prom` (plain `npm run bench` doesn't push), and check the dashboard's time range covers the run. |
| Grafana won't load / port clash | 3000 is the app; Grafana is **3001**. Check `docker compose -f docker-compose.monitoring.yml ps`. |
| Latency looks 1000× too small in Grafana | That's seconds, not ms — see the units note in Concepts. |
| DB filled with "load ticket …" rows | Expected from the write tests. `npm run db:seed` to reset. |

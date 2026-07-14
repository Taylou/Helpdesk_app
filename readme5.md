# Lab — REST API + Load Testing (K6)

So far the app has had exactly one way to change data: **Server Actions** — the
functions a `<form>` calls on submit (`app/actions/tickets.js`). That's convenient,
but it's tied to *this* app's forms on the *same* origin. This lab adds a **REST
API**: a plain HTTP + JSON boundary that **any** client — `curl`, another service,
or a load generator — can call. Then we point **K6** at it to **benchmark** it:
spin up many concurrent virtual users, measure latency and error rates, and assert
those stay within limits.

**What we build:** a tickets API — list, create, read-one, update, delete, and add
a reply — and a k6 script that drives it (mostly reads, a few writes) and **fails
the run** if latency or errors cross a threshold.

> Prerequisite: the database lab (`readme3.md`) is done and **Docker Postgres is
> running** — the API reads/writes live from the DB. k6 hits the **running app**, so
> the dev server must be up too (`npm run dev`).

---

## Part A — Setup (run once)

| # | Command | What it does / means |
|---|---------|----------------------|
| 1 | `winget install k6 --source winget` | Installs the **k6** load-testing tool (a standalone binary — *not* an npm package). macOS: `brew install k6`; other options: https://grafana.com/docs/k6/latest/set-up/install-k6/. |
| 2 | `k6 version` | Confirms k6 is on your `PATH`. |
| 3 | `docker compose up -d` | Start Postgres (same as the DB lab). The API can't read/write without it. |
| 4 | `npm run db:seed` | Reset to the 8 known sample tickets, so the benchmark starts from a known state. |
| 5 | `npm run dev` | Start the app **in its own terminal** — leave it running. k6 calls this live server. |
| 6 | `curl http://localhost:3000/api/tickets` | Sanity-check the API returns a JSON array before load-testing. |
| 7 | `npm run bench:smoke` | **Smoke test**: 1 virtual user for 10s. Proves the script + API work before piling on load. |
| 8 | `npm run bench` | **Load test**: ramps up to 10 virtual users, holds, ramps down (~80s). Prints a summary and a pass/fail based on thresholds. Raise the load with `-e VUS=20`. |

> The load test **creates throwaway tickets** (the ~20% of iterations that POST).
> After a run, `npm run db:seed` again to clear them.

---

## Part B — What changed & what it means

### New files
| File | What it is |
|------|-----------|
| `app/api/tickets/route.js` | Collection endpoint. `GET` lists tickets (query: `status`, `q`, `take`); `POST` creates one → `201`. |
| `app/api/tickets/[id]/route.js` | Item endpoint. `GET` one → `200`/`404`; `PATCH` updates whitelisted fields → `200`/`400`/`404`; `DELETE` → `204`/`404`. |
| `app/api/tickets/[id]/messages/route.js` | Nested resource. `POST` adds a reply to a ticket → `201`/`400`/`404`. |
| `k6/tickets-load.js` | The k6 script: VU stages, weighted read/write work, per-request `checks`, and `thresholds`. |

### Modified files
| File | Change | Why |
|------|--------|-----|
| `lib/tickets.js` | Added **raw** helpers: `listTicketsRaw`, `getTicketRaw`, `createTicket`, `updateTicket`, `deleteTicket`, `addMessage`. | The route handlers need machine-readable data (ISO dates), not the UI's "10m ago" formatting. The existing formatted functions are untouched. |
| `package.json` | Added `bench` + `bench:smoke` scripts. | Short commands to run k6. |
| `.gitignore` | Ignore `k6/summary.json`, `k6/*-report.html`. | Generated benchmark output shouldn't be committed. |

> **Server Actions stay as-is on purpose.** The point of this lab is that the REST
> API is a *second* boundary sitting on the *same* `lib/tickets.js` data layer — the
> forms still use actions; external clients use REST.

### How a request works
Client (`curl`/k6/browser) → **route handler** in `app/api/tickets/*` → helper in
`lib/tickets.js` → **Prisma** → **Postgres** → JSON response. No page render, no
`revalidatePath` — a REST client just wants the data back.

### How a benchmark run works
1. k6 reads `options.stages` and **ramps virtual users** up/down over time.
2. Each VU loops the default function (an **iteration**): list tickets → read one →
   sometimes create one.
3. Every response is wrapped in a **`check`** (status code, shape).
4. When the run ends, k6 evaluates the **`thresholds`**. If any fails (too slow, too
   many errors), k6 **exits non-zero** — so CI can gate on it.

---

## Concepts explained

- **REST & HTTP verbs.** REST models data as **resources** at URLs (`/api/tickets`,
  `/api/tickets/5`) and uses the HTTP **method** to say what to do: `GET` (read),
  `POST` (create), `PATCH` (partial update), `DELETE` (remove).
- **Status codes.** The response's number says what happened: `200` OK, `201`
  Created, `204` No Content (a successful delete), `400` Bad Request (your input was
  invalid), `404` Not Found (no such id), `500` server error. A client reads the
  code, not just the body.
- **Idempotency.** `GET`, `PATCH` (as written here), and `DELETE` can be repeated
  with the same end state; `POST` creates a **new** row each time (not idempotent) —
  which is why the write load grows the table.
- **Route handlers vs Server Actions.** Both run on the server. A **Server Action**
  is called by a form on the same site and can trigger a re-render
  (`revalidatePath`). A **route handler** is a generic HTTP endpoint — any client,
  any language, JSON in/out. Same data layer underneath.
- **Virtual users (VUs) & iterations.** A **VU** is one simulated concurrent user; it
  runs the script in a loop. One loop = one **iteration**. More VUs = more load.
- **Stages / ramping.** Instead of a constant load, we **ramp** VUs up, hold, then
  down — closer to real traffic and it shows how latency changes as load rises.
- **`check` vs `threshold`.** A **check** is a per-request assertion (like a test)
  that records a pass/fail but **doesn't stop the run**. A **threshold** is a
  pass/fail rule over a whole **metric** (e.g. `p(95)<2000`) that sets the **exit
  code** — that's what makes a benchmark gate a build.
- **p95 latency.** The 95th percentile: 95% of requests were faster than this. More
  honest than an average, which a few fast requests can flatter.
- **Throughput.** Requests per second (`http_reqs` / duration) — how much work the
  API handled. Load tests trade throughput against latency.
- **Smoke vs load vs stress.** **Smoke** = tiny load, "does it work?". **Load** =
  expected traffic, "is it fast enough?". **Stress** = push past normal to find the
  breaking point. This lab does smoke + load.

---

## Key concepts (docs)
- Next.js Route Handlers — https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- HTTP request methods (MDN) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
- HTTP response status codes (MDN) — https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- k6 — get started — https://grafana.com/docs/k6/latest/
- k6 — options & stages — https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/
- k6 — thresholds — https://grafana.com/docs/k6/latest/using-k6/thresholds/
- k6 — checks — https://grafana.com/docs/k6/latest/using-k6/checks/
- k6 — HTTP requests — https://grafana.com/docs/k6/latest/using-k6/http-requests/

> Note: the load test **writes to your dev database** (the ~20% of iterations that
> `POST`). Re-run `npm run db:seed` afterward to clear the test tickets. Don't run it
> against data you care about — it's meant for the lab/dev DB.

---

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `k6: command not found` / not recognized | k6 isn't installed or not on `PATH`: re-run the install step, then `k6 version`. Reopen the terminal after installing. |
| `dial: connection refused` / all checks fail | The dev server isn't running or `BASE_URL` is wrong. Start `npm run dev`, or pass `-e BASE_URL=http://localhost:3000`. |
| `Can't reach database server at localhost:5432` (in the app logs) | Postgres isn't up: `docker compose up -d`; check `docker compose ps`. |
| `http_req_duration` threshold fails (p95 too high) | Your machine is slower than the `p(95)<2000` target — lower `VUS` (`-e VUS=5`) or raise the threshold in `k6/tickets-load.js`. First-hit compile in `next dev` is slow; run `bench:smoke` once to warm it up. Remember these are **dev-server** numbers; a production build is far faster. |
| DB filled with "Load test ticket …" rows | Expected — the writes are throwaway. `npm run db:seed` to reset. |
| `404` on `POST /api/tickets/:id/messages` | The ticket id doesn't exist (maybe reseeded). Use an id from `GET /api/tickets`. |

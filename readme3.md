# Lab — Adding a Database (PostgreSQL + Prisma)

Until now every screen read from a hardcoded array (`data/tickets.js`). This lab
swaps that for a real **PostgreSQL** database (run in **Docker**), accessed with
**Prisma**, so the app actually saves tickets and replies. The UI looks the same —
the old sample data becomes the seed.

**Data model:** `Customer → Ticket → Message` (one customer has many tickets; one
ticket has many messages).

---

## Part A — Setup (run once)

> Prerequisite: **Docker Desktop** installed and running.

| # | Command | What it does / means |
|---|---------|----------------------|
| 1 | `docker compose up -d` | Starts a Postgres **server** in a container (see `docker-compose.yml`). `-d` = background. Data lives in a named volume so it survives restarts. |
| 2 | `npm install` | Installs `prisma` + `@prisma/client`. The `postinstall` script also runs `prisma generate`. |
| 3 | *(check `.env`)* | Holds `DATABASE_URL` — how Prisma finds the DB. Matches the docker-compose credentials. |
| 4 | `npx prisma migrate dev` | Reads `prisma/schema.prisma` and **creates the tables**. Saves the SQL under `prisma/migrations/`. |
| 5 | `npx prisma db seed` | Runs `prisma/seed.mjs` to load the 8 sample tickets. Safe to re-run (it clears first). |
| 6 | `npm run dev` | Start the app — pages now read from Postgres. |
| 7 | `npx prisma studio` | Optional GUI to browse/edit your data in the browser. |

**Reset everything:** `docker compose down -v` (deletes the DB volume), then repeat
steps 1, 4, 5.

---

## Part B — What changed & what it means

### New files
| File | What it is |
|------|-----------|
| `docker-compose.yml` | Defines the Postgres server (image, port `5432`, credentials, volume). |
| `prisma/schema.prisma` | The **schema** — your models become tables. Single source of truth. |
| `prisma/seed.mjs` | Inserts the sample data (sourced from `data/tickets.js`). |
| `lib/prisma.js` | One shared Prisma **Client** (the object you query the DB with). |
| `lib/tickets.js` | Data-access layer: `getTickets / getTicket / getStats` — returns the same shape the components already expected, so the UI barely changed. |
| `lib/format.js` | Turns real `DateTime`s back into "10m ago" / "08:14" strings. |
| `app/actions/tickets.js` | **Server Actions** that write to the DB (create ticket, add reply). |
| `.env` | `DATABASE_URL`. (Prisma reads `.env`, not `.env.local`.) |

### Modified files
| File | Change | Why |
|------|--------|-----|
| `app/page.js`, `app/tickets/page.js` | Now `async`, `await` the DB; marked `force-dynamic`. | Always show live data, not a build-time snapshot. |
| `app/tickets/[id]/page.js` | Reads from `lib/tickets.js`; reply box is a `<form>` calling a server action. | Replies now save. |
| `app/new/page.js` | Form `action={createTicketAction}` + field `name`s. | New tickets now save and redirect to the ticket. |
| `data/stats.js` | **Removed** — logic moved into `getStats()`. | Stats are computed from the DB now. |

### How the two flows work
- **Read:** page (server component) → `lib/tickets.js` → Prisma → Postgres → mapped to the component shape.
- **Write:** `<form>` submit → **Server Action** in `app/actions/tickets.js` → Prisma insert → `revalidatePath()` refreshes the page (create also `redirect()`s to the new ticket).

---

## Key concepts (docs)
- Prisma schema & models — https://www.prisma.io/docs/orm/prisma-schema
- Migrations (`migrate dev`) — https://www.prisma.io/docs/orm/prisma-migrate
- Querying with Prisma Client — https://www.prisma.io/docs/orm/prisma-client
- Seeding — https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
- Next.js Server Actions (writing data) — https://nextjs.org/docs/app/getting-started/updating-data
- `revalidatePath` — https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- `dynamic = "force-dynamic"` — https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
- Postgres in Docker — https://hub.docker.com/_/postgres

> Note: we pin **Prisma 6** on purpose. Prisma 7 changes how the connection is
> configured (driver adapters + `prisma.config.ts`) and adds complexity that isn't
> needed for this lab.

---

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `Can't reach database server at localhost:5432` | Postgres isn't up: `docker compose up -d`; check `docker compose ps`. |
| `prisma migrate` asks to reset / drift | `docker compose down -v` then re-run setup (wipes data). |
| Changed `schema.prisma`? | Re-run `npx prisma migrate dev --name <change>`. |
| New ticket doesn't appear | Make sure you ran the seed and the dev server is running. |

# shipment-tracker
# Shipment Status Tracker

A full-stack app for tracking shipments through their lifecycle — booked, in transit, customs hold, delivered, the works. Built for Nagarkot's take-home assignment.

**Live app:** https://ajinkya.tail32b205.ts.net:10000
**API:** https://ajinkya.tail32b205.ts.net:8443 · health check at `/health`

A quick note on the deployment: instead of Vercel/Render, I deployed this on my own home server (a repurposed HP running Ubuntu, Docker Compose for both services, Postgres included), exposed publicly through Tailscale Funnel. I run a small self-hosted setup already (Nextcloud, Immich, a monitoring stack, that kind of thing) so this was a natural fit and let me show that side of what I do too. Both services are Dockerized so they'd deploy the exact same way on Render/Fly/wherever if that's preferred — happy to spin that up too if it matters for grading.

---

## Why I built it this way

**Backend:** Express, kept deliberately plain. NestJS would've been overkill for five endpoints — I'd rather ship something small and readable than something that "looks enterprise" but is 80% boilerplate.

**Database:** Postgres + Prisma. The interesting decision here is the data model — I didn't just store a `status` column on the shipment and call it a day.

There are two tables: `shipments` and `shipment_events`. Events are the actual source of truth — every status change is an immutable row with a timestamp, note, and location. The `current_status` field on the shipment itself is a cached copy of the latest event, updated in the same transaction as the event insert. Why bother? Because the shipment list is the page people hit constantly, and I didn't want it running a subquery per row to figure out "what's the latest status" — one indexed column, one clean query. The events table earns its keep on the detail page where the actual history matters.

**Status flow** isn't just five states you can jump between freely — I modeled it closer to how customs holds actually work in freight (a shipment can bounce in and out of customs, exceptions are recoverable, delivered/cancelled are final). It's enforced server-side with an explicit transition map, so a bad request gets a 422 telling you exactly what states you could've moved to instead. The frontend mirrors this to trim the dropdown, but the server's the one that actually decides — never trust the client for something like this.

**Concurrency** — this one I actually think about a lot, because it's the kind of bug that doesn't show up until two people hit "update" on the same shipment within the same second. I lock the row (`SELECT ... FOR UPDATE`) inside the status-update transaction so that can't silently corrupt the history. Small detail, but it's the difference between a toy CRUD app and something that'd survive contact with real concurrent users.

**Frontend:** Next.js App Router, server components doing the data fetching directly — no client-side fetching library needed for something this size. Tailwind for styling because I wanted to spend my time on the data model, not fighting CSS.

---

## Running it locally

```bash
git clone <repo-url>
cd nagarkot-shipment-tracker

# spin up postgres
docker compose up -d

# backend
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed          # drops in 18 realistic sample shipments
npm run dev           # localhost:4000

# frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev           # localhost:3000
```

No Docker? Point `DATABASE_URL` at any Postgres 16 instance and skip the compose step.

There's a `backend/requests.http` file with every endpoint ready to fire if you use the REST Client extension — faster than writing curl commands by hand.

## API

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | is it alive |
| POST | `/api/shipments` | create a shipment (auto-creates the opening "Booked" event) |
| GET | `/api/shipments` | list, with `?status=`, `?q=`, `?page=` |
| GET | `/api/shipments/:id` | one shipment + full history |
| PATCH | `/api/shipments/:id/status` | move it forward — rejected with a 422 if the transition's illegal |

## Assumptions I made

- Reference numbers are unique, case-insensitive, stored uppercase.
- Every new shipment gets a `BOOKED` event automatically — no shipment ever has empty history.
- Delivered and Cancelled are terminal. Exception isn't — in real freight, exceptions (damage, delay, whatever) usually get resolved and the shipment keeps moving.
- Dates for expected delivery are just dates, not timestamps — forwarders quote "arrives the 15th," not "arrives at 14:32."
- No auth, no multi-tenancy, no roles — explicitly out of scope per the brief.

## If this had to handle 10,000 shipments and real concurrent traffic

Honestly, 10k rows is nothing for Postgres — that's not where this would break. The actual risk is concurrent writes on the same shipment: two people updating status at once could both read the old value, both pass validation, and both write — which is exactly why I already lock the row during an update rather than leaving it to chance. At real scale I'd probably switch that to an optimistic `version` column instead of a hard lock, so conflicting requests get a fast 409 to retry rather than queuing behind each other. On the read side, offset pagination gets weird once rows are being inserted mid-scroll, so cursor-based pagination would replace it, and the `ILIKE` search would need a proper trigram index once the dataset's big enough that a full scan actually shows up in latency. Connection pooling (PgBouncer, or Neon's built-in pooler if I moved off self-hosted) becomes necessary well before the row count is actually a problem — a handful of API instances each holding their own Prisma pool will exhaust Postgres connections long before 10k rows does anything. And `shipment_events`, being append-only and the fastest-growing table, is the natural one to eventually partition by month and push onto a read replica so history queries don't compete with the write path.

## What I'd add with more time

- Automated tests — I prioritized getting the concurrency handling and data model right over writing tests in the given time box, but that'd be next.
- Real-time updates instead of manual refresh (SSE, or just polling smarter).
- The frontend's transition map is currently duplicated from the backend's — would pull it from `/api/meta/statuses` at build time instead so there's one source of truth.

---

Built end-to-end (backend, frontend, deployment, the lot) in one focused stretch. Happy to walk through any of the decisions above.
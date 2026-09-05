# ARUKAH Digital Platform

Creating Solutions. Building Skills. Serving Communities.

Public-facing platform for the ARUKAH ecosystem (ARUKAH TECH, ARUKAH WEAR,
ZIVA Special Classes, ARUKAH MEDIA, and REPENT ONLINE MINISTRIES). Built as a
modular monolith so it can grow into a multi-organization platform without a
rewrite. See `docs/ARCHITECTURE.md` for the reasoning behind that choice.

## Tech stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS 4
- **Database (future phases):** PostgreSQL (Supabase-compatible)
- **Deployment (initial):** Vercel — architecture kept portable, see `docs/ARCHITECTURE.md`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # ESLint
npx tsc --noEmit  # type-check without emitting files
```

## Project structure

```
src/
  app/          Next.js App Router routes (pages, layouts)
  components/   Shared, reusable UI components (design system)
  features/     Domain/business-feature modules (e.g. contact, businesses)
  lib/          Framework-agnostic utilities and helpers
  server/       Server-only code: business/service layer
  db/           Database schema, migrations, and data-access (repository) layer
  types/        Shared TypeScript types
  config/       App-wide configuration (site metadata, constants)
public/
  branding/     Supplied logo assets, organized per division
    arukah/     ARUKAH master brand
    tech/       ARUKAH TECH
    footwear/   ARUKAH WEAR
    ziva/       ZIVA Special Classes
    ministry/   REPENT ONLINE MINISTRIES
docs/           Architecture, environment, and operational documentation
```

Within `server/`, keep API route handlers, business/service logic, and data
access separated as the backend grows — see `docs/ARCHITECTURE.md`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in real values. Never commit
`.env.local` or any file containing real secrets — see `docs/ENVIRONMENT.md`
for what each variable is for and when it's needed.

## Documentation

- `docs/ARCHITECTURE.md` — system design, scaling approach, module boundaries
- `docs/ENVIRONMENT.md` — environment variable reference
- `docs/BRANDING.md` — brand assets and per-division identity notes

## Development phases

This project is built incrementally, one phase at a time, to keep changes
reviewable and avoid unnecessary rework. See `docs/ARCHITECTURE.md` for the
current phase and what's intentionally deferred.

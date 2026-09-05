# ARUKAH Platform — Architecture

## Current phase

**Phase 2: Brand/design system.** Phase 1 (project structure, environment
reference, branding asset organization) is done. This phase adds per-division
colour tokens (sampled from the supplied logos — see `docs/BRANDING.md`) and
the first shared UI primitives (`Container`, `Button`, `Card`,
`SectionHeading`) in `src/components/ui`. No homepage, business-unit pages,
Header/Footer, or database work yet — those are later phases (see bottom of
this file).

## Why a modular monolith (not microservices)

**WHAT:** The app is one Next.js codebase with clearly separated internal
modules (`components`, `features`, `lib`, `server`, `db`), not a set of
independently deployed services.

**WHY:** Microservices add operational cost (multiple deployments, network
calls between services, distributed debugging) that isn't justified until
real traffic or team size demands it. A modular monolith gets the main
benefit people want from microservices — clear boundaries between domains —
without that cost.

**LONG-TERM IMPACT:** If one module (e.g. the footwear catalogue, or ZIVA
student management) genuinely outgrows the monolith later, it can be
extracted into its own service because its boundaries are already clean.
Nothing here blocks that; nothing here requires it prematurely.

## Why Next.js + PostgreSQL

**WHAT:** Next.js (App Router, TypeScript) for the application layer,
PostgreSQL for the database, both chosen to run on more than one vendor.

**WHY:** Next.js gives server-rendering, static generation, and API routes
in one framework, so public marketing pages can be cached/static while
future authenticated features (admin, portal) run as dynamic server code in
the same codebase. PostgreSQL is a mature, standard relational database
supported by many managed providers (Supabase, AWS Aurora, plain Postgres),
so the platform is not locked into one company's proprietary database.

**LONG-TERM IMPACT:** The business logic in `src/server` and `src/db` should
talk to PostgreSQL through standard SQL/an ORM, not through
provider-specific SDKs where avoidable. That keeps a future migration
between database hosts to "change a connection string and run migrations"
rather than a rewrite.

## Scaling approach: cache first, database last

**WHAT:** Public content should be served from static generation / CDN
caching wherever possible. The database is only queried when content is
genuinely dynamic or user-specific.

```
Browser → CDN / Edge → Cached or statically generated content
                              ↓ (only when necessary)
                        Application layer
                              ↓ (only when necessary)
                        Database / cache / storage
```

**WHY:** Most visits to a public brochure-style site request the same
content repeatedly. Serving that from cache means traffic growth is
absorbed by the CDN, not by the database or app servers.

**LONG-TERM IMPACT:** As traffic grows, the first response is adding
application instances or leaning harder on caching — not redesigning the
system. This is a foundation for progressive scaling, not a guarantee of
unlimited scale.

## Backend layering (from Phase 8 onward)

When server-side functionality is introduced, keep these layers separate
inside `src/server` and `src/db`:

- **API layer** (`src/app/api/**/route.ts`) — parses requests, calls the
  service layer, formats responses. No business logic here.
- **Service/business layer** (`src/server`) — validation, business rules,
  authorization decisions.
- **Data/repository layer** (`src/db`) — the only code that talks to
  PostgreSQL directly.

UI components never contain business logic or direct database calls.

## Multi-tenancy (future)

ARUKAH TECH will eventually build systems for separate organizations
(schools, churches, fuel stations). When that arrives, every tenant-owned
table carries an `organization_id`, and row-level security / authorization
checks ensure one organization can never read or write another's data. This
is a design constraint to honor when those tables are created — no
multi-tenant tables exist yet.

## Infrastructure portability

No secrets live in this repository. Configuration is read from environment
variables (see `docs/ENVIRONMENT.md`), not hardcoded to one hosting
provider. Initial deployment target is Vercel for its Next.js integration,
but nothing in the application code should assume Vercel-only APIs.

## Phase roadmap

1. Project architecture and foundation
2. **Brand/design system using supplied logos** *(current)*
3. Homepage
4. Business pages
5. Projects + Ministry + Contact
6. SEO + Accessibility + Performance
7. Production deployment
8. Backend foundation + database + enquiry system
9. Authentication and ARUKAH Admin
10. Client Portal
11. ZIVA platform
12. Footwear catalogue/e-commerce
13. Media platform/content management
14. PWA
15. Advanced scaling, observability, backups and disaster recovery
16. Security audit and production hardening

Each phase is scoped, implemented, checked, and reported before the next
begins.

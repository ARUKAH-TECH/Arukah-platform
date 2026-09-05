# Environment Variables

Copy `.env.example` to `.env.local` for local development. Never commit
`.env.local`, or any file with real values, to git.

| Variable | Required from phase | Purpose |
|---|---|---|
| `SITE_URL` | 1 | Canonical site URL, used for metadata/SEO and absolute links (`layout.tsx`, `sitemap.ts`, `robots.ts`). Deliberately **not** `NEXT_PUBLIC_`-prefixed — it's only ever read in server code, never in browser-executed code, so it doesn't need to be exposed to the client. |
| `DATABASE_URL` | 8 | PostgreSQL connection string — currently a **Neon** project (chosen over Supabase/Railway/Render, see `docs/ARCHITECTURE.md`). Server-only. Set locally in `.env.local` as of Phase 7; not yet used by any code, and not yet added to Vercel's production env vars. |
| `NEXT_PUBLIC_SUPABASE_URL` | 8 (if Supabase is chosen) | Supabase project URL. Public. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 8 (if Supabase is chosen) | Supabase anonymous/public key. Safe for the browser — respects Row Level Security. |
| `SUPABASE_SERVICE_ROLE_KEY` | 8 (if Supabase is chosen) | Bypasses Row Level Security. **Server-only, never sent to the browser, never logged.** |
| `REDIS_URL` | 15 | Caching layer connection string, once introduced. |
| `STORAGE_ENDPOINT` / `STORAGE_BUCKET` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` | 12–13 | S3-compatible object storage for product/media files. All server-only. |
| `EMAIL_FROM` / `EMAIL_PROVIDER_API_KEY` | 8 | Outbound email for the contact/enquiry system. **Not yet used** — the Phase 5 `/contact` form logs to server console instead; see `docs/ARCHITECTURE.md`. |
| `SENTRY_DSN` | 15 | Error monitoring. |

## Rules

- Anything prefixed `NEXT_PUBLIC_` is bundled into client-side JavaScript and
  is visible to every visitor. Never put a secret behind that prefix.
- Anything without that prefix is server-only and must stay server-only —
  don't pass it into a Client Component or an API response.
- `SUPABASE_SERVICE_ROLE_KEY` (or any equivalent admin/service key for a
  future provider) grants full database access and bypasses row-level
  security. It must only ever be read on the server, and only when the task
  genuinely needs to bypass RLS (e.g. a trusted backend job) — ordinary
  server-side user requests should still go through the anon key plus RLS.

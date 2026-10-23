# Environment Variables

Copy `.env.example` to `.env.local` for local development. Never commit
`.env.local`, or any file with real values, to git.

| Variable | Required from phase | Purpose |
|---|---|---|
| `SITE_URL` | 1 | Canonical site URL, used for metadata/SEO and absolute links (`layout.tsx`, `sitemap.ts`, `robots.ts`). Deliberately **not** `NEXT_PUBLIC_`-prefixed — it's only ever read in server code, never in browser-executed code, so it doesn't need to be exposed to the client. |
| `DATABASE_URL` | 8 | PostgreSQL connection string for the **Supabase** project `arukah-platform` (ARUKAH-TECH's Org) — used for migrations / direct SQL. Server-only. Replaced an earlier, never-used Neon database on 2026-10-21. Not yet used by any code, and not yet added to Vercel's env vars. |
| `NEXT_PUBLIC_SUPABASE_URL` | Foundation | Supabase project URL (`https://frnhrxyyfthbtjjmjxrm.supabase.co`). Public. Required by the admin area (`/admin`) and `src/proxy.ts`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Foundation | Holds the project's **publishable** key (`sb_publishable_…`, Supabase's replacement for the legacy anon key). Safe for the browser — every query is limited by Row Level Security. |
| `SUPABASE_SERVICE_ROLE_KEY` | Payments | Supabase **secret** key (`sb_secret_…` or legacy `service_role`). Bypasses Row Level Security, but the database grants it only what payments need (read order totals, write `payments`, mark orders paid). Used only by `src/server/payments.ts`. **Server-only, never sent to the browser, never logged.** |
| `PAYSTACK_SECRET_KEY` | Payments | Paystack secret key (`sk_test_…` / `sk_live_…`). **Server-only secret.** Online payments stay off until this and the key above are set. See `docs/PAYMENTS.md`. |
| `PAYSTACK_RECEIPT_EMAIL` | Payments | The owner's business email used for every Paystack payment, so visitors aren't asked for theirs; receipts arrive there. Not secret. |
| `REDIS_URL` | 15 | Caching layer connection string, once introduced. |
| `STORAGE_ENDPOINT` / `STORAGE_BUCKET` / `STORAGE_ACCESS_KEY_ID` / `STORAGE_SECRET_ACCESS_KEY` | 12–13 | S3-compatible object storage for product/media files. All server-only. |
| `EMAIL_FROM` / `EMAIL_PROVIDER_API_KEY` | 8 | Outbound email for the contact/enquiry system. **Not yet used** — the Phase 5 `/contact` form logs to server console instead; see `docs/ARCHITECTURE.md`. |
| `SENTRY_DSN` | 15 | Error monitoring. |
| `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` | Search (optional) | The code from Google Search Console / Bing Webmaster Tools' **HTML tag** method, added as a `<meta>` tag on every page. Not needed if the site is verified by a DNS record in Cloudflare (preferred). Not secret. |
| `FAL_KEY` | Adverts (optional) | fal.ai API key for **Make AI video** on advert requests (Kling 2.6 Pro image-to-video, about US$0.07/second). **Server-only secret** — set in Vercel, never committed, never sent to the browser. Without it the feature shows “not set up”. |

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

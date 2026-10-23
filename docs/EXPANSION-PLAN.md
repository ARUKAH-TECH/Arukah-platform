# ZIVARUKAH Platform — Expansion Plan (Phases 4–10)

Written 2026-10-21 from the founder's ZIVARUKAH.COM brief. **This is a plan,
not built software.** Nothing below exists yet unless marked done. Each
phase is built, tested, and approved separately before the next begins.

Already done: Phase 1 (inspection), Phase 2 (zivarukah.com connected —
Cloudflare DNS → Vercel, `www` → apex), Phase 3 (ZIVARUKAH umbrella rebrand,
`/books` placeholder — live).

**Progress (2026-10-23):** Phase 4 milestones (a) and (b) are done and live —
admin login with two-factor, projects + media library, projects shown on the
homepage, each division page, `/projects` and the sitemap. Both database
migrations are applied to the Supabase project.

**Progress (2026-10-23, later):** milestone (c) built on branch
`phase4c-announcements` — `announcements` table (migration
`20261023010000_announcements.sql`), admin list/new/edit/delete with
start/end scheduling and a live preview, and a banner slot at the top of the
homepage and every division page. Scheduling needs no background job: Row
Level Security compares against `now()` and the pages refresh every 60
seconds. Live since 2026-10-23 (PR #2).

**Phase 4 complete (2026-10-23):** milestone (d) is live in three steps
(PRs #3–#5). `page_content` table (migration
`20261023020000_page_content.sql`) stores only admin-edited fields; every
field's original wording lives in `src/config/pages/` as its default, and
`mergePageText` falls back to it for any missing, empty, mistyped or
over-long value, or if the database is unreachable. Editable: homepage,
TECH, WEAR, ZIVA, MEDIA, BOOKS, Ministry, Projects and Contact pages, via
Admin → Page text. Brand names, logos, button labels and navigation stay in
code by design.

**Phase 5 (2026-10-23):** live except the support switch, which waits for
Phase 6 payments.
- Step 1 (PR #6): `outreaches` table (migration `20261023030000`). The
  database refuses to publish or schedule a hospital or prison outreach
  without facility permission. The private permission note is in the
  admin-only `outreach_private_notes`. Public pages: `/ministry/outreach`
  and a detail page per outreach.
- Step 2: `outreach_media` (migration `20261023040000`) with a consent
  checklist (identifiable people / children / patients / prisoners). An
  item is visible only when it has been reviewed and, if sensitive,
  written permission is recorded, AND its outreach is public. RLS enforces
  this for rows, and the storage policy enforces it for files. Images sit
  in the PRIVATE `outreach-media` bucket and are served only via
  `/outreach-photo/<id>`, which re-checks as an anonymous visitor and
  redirects to a 1-hour signed link (cached for 5 minutes). Permission
  notes are in the admin-only `outreach_media_private_notes`.

---

## Starting point (what exists today)

- **App:** Next.js 16 (App Router, TypeScript), Tailwind CSS 4. Every page is
  static; the only server code is two form Server Actions that currently
  just log submissions (no storage yet).
- **Hosting:** Vercel project `arukah-tech/arukah-platform`, auto-deploys
  from `main` on GitHub `ARUKAH-TECH/Arukah-platform`.
- **Database:** an empty Supabase project `arukah-platform` (free plan,
  EU region) created 2026-10-21. Not connected to the code yet.
- **Decision:** keep this stack. Supabase gives Postgres, login, and private
  file storage in one place, which covers almost every phase below without
  adding new vendors. No microservices.

## Recommended build order

The brief numbers these 4–10. Some depend on others, so the build order is:

1. **Foundation** (part of Phase 4): database connection, admin login,
   admin shell, audit log, backups doc. Everything else needs this.
2. **Phase 4** — content management.
3. **Phase 5** — ministry outreach projects (needs 4).
4. **Phase 6** — `/support` payments (needs 5 for projects to support).
5. **Phase 8** — bookstore (reuses the payment work from 6).
6. **Phase 7** — advertising (reuses approval + payment pieces).
7. **Phases 9 and 10** are not separate builds — they are rules applied
   inside every phase above (international, security, quality).

---

## Phase 4 — Central content management (admin dashboard)

**What:** a private `/admin` area where the main administrator edits site
content, uploads photos/videos, manages projects, banners, announcements,
ministry activities, ads, books, and views support reports.

**Why:** today every content change needs a developer to edit code. The
admin dashboard lets the founder run the site alone.

**How it stays private:**
- Login through Supabase Auth. **Public sign-up disabled** — the only
  account is the main administrator, invited by email. Two-factor
  authentication (TOTP app) required for the admin.
- Every admin page and every admin action checks on the **server** that the
  signed-in user has the `owner` role. Knowing the `/admin` URL gives a
  visitor only a login screen. Database Row Level Security (RLS) is the
  second lock: even a bug in a page can't read or write private rows.
- Admin pages are excluded from the sitemap and marked `noindex`.
- An **audit log** records who changed what and when.
- Roles table exists from day one (`owner` only at first) so more staff can
  be added later without a rebuild.

**Content model (one table per kind, all sharing these fields):**
`status` (draft / scheduled / published / archived), `publish_at`,
`unpublish_at`, `branches` (which divisions show it: tech, wear, ziva,
media, books, ministry, home), `created_by`, timestamps.

Kinds: pages sections, projects, banners/announcements, media items
(photo/video), ministry activities. Scheduled items go live automatically
at `publish_at` (checked at request time + a small scheduled job).

**Media uploads:** images to Supabase Storage (public bucket, resized on
upload). **Videos:** recommend linking YouTube/TikTok uploads rather than
hosting raw video — video hosting is expensive and the free plans have
1 GB storage. Self-hosted video can be revisited later.

**Milestones:** (a) DB + login + empty admin shell; (b) projects + media
library; (c) banners/announcements + scheduling; (d) existing static pages
read their editable text from the database (with the current text as the
starting content, so nothing visible changes on switch-over).

**Risks:** losing the only admin login (mitigation: recovery codes stored
offline, plus a documented recovery procedure); free Supabase plan pauses
after ~7 days of no activity and has **no automatic backups** (see Phase 10).

**Tests:** non-admin and logged-out users get no admin data (automated
tests against RLS and server checks); scheduled publish/unpublish;
uploads reject wrong file types and oversize files.

---

## Phase 5 — Ministry outreach and humanitarian projects

**What:** Repent Online Ministries project pages (hospital, prison, street,
community and crusade outreach) with title, purpose, date, location,
photos/videos, needs list, optional fundraising target, verified
contributions, and an optional support button.

**Rules built into the system:**
- **Support button is off by default.** The admin turns it on per project.
  Uploading a photo or video never adds a button by itself.
- Each media item is attached to one project; the support page for that
  project shows only media the admin attached.
- Before publishing a photo/video, the admin must tick a **consent
  checklist**: identifiable people? children? patients? prisoners? If any
  is ticked, the item can't be published until "written permission
  recorded" is also ticked (with a note of who gave it). Prison and
  hospital visits additionally get a "facility permission obtained" field.
- Option to blur or crop faces before publishing is a manual step for now
  (no automatic face detection — not reliable enough to trust).
- Fundraising totals shown publicly come **only** from verified payments
  (Phase 6). Admin-entered offline gifts are shown separately and labelled
  as recorded by the ministry. No invented totals.

**Milestones:** project pages + admin editor + consent checklist; then the
support switch once Phase 6 exists.

**Risks:** privacy harm to vulnerable people — the checklist is a guard,
not a substitute for judgement; facility rules (prisons especially) may
forbid photography entirely.

---

## Phase 6 — Global support system (`/support`)

**What:** supporters pick an eligible project, choose a suggested or
custom amount, pay without creating an account, and get a receipt.

**Flow:** choose project → amount → name (optional) + email or phone →
redirect to the payment provider → provider confirms → **server verifies
the payment with the provider's API** (never trusting the browser) →
record marked `successful` → receipt by email/SMS → project total updates.

**Records kept (per transaction):** project, amount + currency charged,
display currency + exchange rate if different, provider reference, our
reference, status (pending / successful / failed / refunded), timestamps,
supporter contact (optional, for receipts). Refunds are new records linked
to the original, never edits. A daily reconciliation compares our records
with the provider's settlement report and flags mismatches.

**Payment provider research (2026-10-21 — verify before signing up):**

| Provider | Ghana fit | Fees found | Notes |
|---|---|---|---|
| **Paystack** (recommended) | MTN/Telecel/AT mobile money, local + international cards | ~1.95% per transaction, local and international, no monthly fee | Owned by Stripe. Official Ghana page says USD display and USD settlement are possible; third-party guides say international payments settle in GHS. Requires a **registered business** in Ghana per its support pages — confirm in writing. |
| Flutterwave | Cards, mobile money, 30+ currencies | 2.6% local card, 2% MoMo/bank, **4.8% international** (official Ghana pricing page) | Good backup; higher cost for overseas supporters. |
| Hubtel | Strong mobile money + cards + GhQR, hourly settlement | No official rate card found (~1.95% reported secondhand) | Ghana-only focus; weaker for international donors. |
| Stripe | **Not directly available** to Ghana businesses | — | Listed as "extended network" served through Paystack. |

Recommendation: **Paystack first** (cheapest for international cards, one
integration covers MoMo + cards), Flutterwave as a fallback if Paystack
declines the account. No currency or method is promised on the site until
the live account confirms it.

**Legal/tax (not legal advice — confirm with a Ghanaian lawyer/accountant):**
- Paystack (and banks) will want a registered entity. Ministry donations
  usually go through a **company limited by guarantee** registered with the
  Registrar-General, then recognition by the Department of Social Welfare /
  NGO regulator, and GRA tax-exemption status if wanted. Sources conflict on
  which regulator issues the recognition certificate today — check
  directly.
- Decide which entity receives ministry donations (ZIVARUKAH VENTURES is a
  business; donations to it are not charitable gifts).
- Collecting supporters' names/emails/phones means registering with the
  **Data Protection Commission** under the Data Protection Act, 2012
  (Act 843) — this already applies to the existing contact forms.

**Security:** webhook signature check + server re-verification; idempotent
processing (a repeated webhook can't double-count); rate limiting and
bot protection (e.g. Cloudflare Turnstile) on the form; amounts validated
on the server against min/max.

**Tests:** provider test mode end-to-end (success, failure, abandoned,
duplicate webhook, refund); totals change only on verified success.

---

## Phase 7 — Advertising management ("Advertise With Us")

**What:** a public application form for advertisers, plus an admin
workflow to approve advertisers, approve ads, confirm payment, schedule,
and report.

**Three separate approvals (never one switch):**
1. **Advertiser** approved (business is real and acceptable).
2. **Advertisement** approved (content checked).
3. **Payment** confirmed (verified provider payment, or admin-recorded
   invoice payment for negotiated corporate deals).

Ad statuses: draft → pending review → approved / rejected → scheduled →
published → expired. An ad appears on the site only when all three
approvals are true **and** today is inside its start/end dates **and**
its placement's branch accepts ads.

**Admin controls:** packages (price, duration, placement), which branches
accept ads (ministry pages default **off**), premium placements, custom
corporate campaigns with negotiated prices, direct uploads by the admin.

**Uploads from outsiders:** stored privately until approved; file type and
size limits; images re-encoded; destination URLs checked and shown with
`rel="sponsored noopener"`; advertisers never see other advertisers' data.

**Reporting:** impressions and clicks counted server-side, privacy-friendly
(no third-party trackers). Numbers are counts, not guarantees of results.

**Ad networks (e.g. Google AdSense):** a separate, optional later step.
Approval isn't guaranteed and revenue is unpredictable; network ads can't
be content-controlled the same way, so they'd stay off ministry pages.

---

## Phase 8 — ZIVARUKAH BOOKS

**What:** an international bookstore: timed online reading, digital
downloads (priced higher), and printed books (delivery or collection).

**Catalogue:** each book has separate prices per format (GHS base), cover,
description, sample pages, optional audio sample. Admin-only management.

**Cart and discount:** multi-book checkout. Default promotion: 10% off
when **more than three** qualifying books are in the cart. Admin controls
percentage, minimum quantity, dates, eligible formats, other conditions.
The discount is calculated on the server, stored on the order, and shown
line by line.

**No accounts — access codes:** after verified payment the customer gets
a one-time code by email or SMS. Entering it (plus the same email/phone)
opens their library. Codes are long, random, rate-limited, and can be
reissued by the admin.

**Formats:**
- *Timed reading:* access starts at confirmed payment and ends at the
  purchased time; pages are served one at a time through short-lived
  signed links, never the whole file.
- *Download:* file in a **private** storage bucket; link valid for
  minutes, limited number of downloads, watermarked with the buyer's
  reference where the format allows.
- *Printed:* quantity, delivery address or collection point, delivery
  charge, order status (paid → printing → shipped/ready → delivered).
  Printing itself stays out of scope; this only records orders.

**Read-aloud:** the browser's built-in speech (works on most modern
browsers, voice quality varies). For selected books the admin can upload
professionally recorded audio instead.

**Honesty note for the site and the founder:** no system can fully stop
copying — anyone can photograph a screen or record audio. The controls
above make casual sharing harder and traceable; they can't make it
impossible.

---

## Phase 9 — International visitors

Applied inside Phases 6–8:
- **Display vs charged currency are always separate.** Prices are stored
  in GHS; visitors may see an approximate local price, clearly labelled,
  but checkout shows the exact amount and currency that will be charged.
- **Exchange rates:** fetched daily from one reliable rate API (choose at
  build time — confirm it covers GHS), cached, with admin overrides for
  chosen currencies. Every order stores the rate used.
- **Country detection:** Vercel provides an approximate country from the
  visitor's network — used only to pre-select currency/payment options,
  never stored, always changeable by the visitor.
- Payment options shown per country only where the provider actually
  supports them.
- Mobile-first, fast static public pages served from Vercel's global CDN,
  accessible reading/audio features.

---

## Phase 10 — Technical quality and long-term ownership

Applied throughout:
- **Security:** server-side auth checks + RLS, server-side payment
  verification, input validation on every form, rate limiting, bot
  protection, private storage for paid content, secrets only in
  environment variables (never in Git), dependency updates.
- **Backups:** the free Supabase plan has **no automatic backups**. Before
  any real money or customer data is stored, either upgrade to Supabase Pro
  (about US$25/month, daily backups) or run a scheduled database export to
  separate storage — plus a tested restore procedure in
  `docs/BACKUP-AND-RECOVERY.md`.
- **Hosting plan:** Vercel's free Hobby plan is for **non-commercial** use
  under Vercel's terms. A site taking payments and selling ads should be on
  Vercel Pro (about US$20/month) — confirm current pricing and terms.
- **Migrations:** every database change is a versioned SQL migration in
  the repo, applied the same way locally and in production.
- **Monitoring:** error tracking (e.g. Sentry; `SENTRY_DSN` is already
  reserved) and uptime checks; payment webhook failures alert the admin.
- **Ownership continuity:** accounts (GitHub, Vercel, Supabase, Cloudflare,
  Paystack) owned by an organisation email, not one person's; a second
  trusted owner on each; `docs/` explains how to run, deploy, restore, and
  rotate keys without the original developer.
- No promises of unlimited traffic, zero downtime, or guaranteed revenue.

---

## Decisions needed from the founder

1. Which **registered entity** will receive ministry donations and book/ad
   payments (affects Paystack sign-up and tax).
2. Register with the **Data Protection Commission** (Act 843).
3. Approve paid plans when money starts flowing: Supabase Pro (backups)
   and Vercel Pro (commercial use).
4. An **organisation email** for owning the accounts (also needed for the
   site's own email on `@zivarukah.com`).
5. Confirm build order above (Foundation → 4 → 5 → 6 → 8 → 7).

## Sources (checked 2026-10-21)

- Paystack Ghana pricing: support.paystack.com/en/articles/2131842 ;
  paystack.com/gh/why-choose-paystack ; maxmegroup.com/learn/paystack-vs-hubtel-vs-expresspay
- Flutterwave Ghana pricing: flutterwave.com/gh/pricing
- Hubtel: explore.hubtel.com ; kolonell.com (secondhand fee estimate)
- Stripe availability for Ghana: rapyd.net/blog/are-you-located-in-a-stripe-supported-country
- NGO registration: mondaq.com/corporate-governance/1695406 ; afriwise.com/blog/taxation-for-not-for-profits-ngos-in-ghana
- Data protection: dataprotection.org.gh/registration ; dlapiperdataprotection.com (Ghana)

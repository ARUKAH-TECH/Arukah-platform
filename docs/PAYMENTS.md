# Online payments (Paystack)

Built and deployed, **switched off** until the owner adds the settings below.

## What visitors see (the website collects no personal details)

- **Books:** on a book page, choose format and quantity → **Pay now** →
  Paystack's own page → Mobile Money (approve with PIN) or card (OTP).
  Back on `/payments/done` they see "payment received", the reference, and a
  **Send reference on WhatsApp** button (with the book, quantity and reference
  typed in) so we can deliver. 10% off for more than 3 copies.
- **Gifts:** `/ministry/support` → amount (and optionally which outreach) →
  **Give now** → Paystack.
- "Order on WhatsApp" stays available alongside.

Paystack needs an email for every payment; we send the owner's business email
(`PAYSTACK_RECEIPT_EMAIL`), so receipts arrive there and the visitor isn't asked.

Both the return page and the signed webhook ask Paystack directly before
recording anything, check GHS and the exact amount, and record each payment
once (`quick_payments` table, references `ZS-…`). Admin → **Payments** lists
them, with **Mark as sent** for books.

(The older order-with-details flow, `payments` table / `ZP-…`, is kept for when
the forms are switched back on — see `src/config/forms.ts`.)

## Switching it on (owner)

1. Open a Paystack account (Ghana, **Starter Business** is fine): Ghana Card,
   TIN (Ghana Card number), and a MoMo number or bank account in the same name.
2. Vercel → arukah-platform → Settings → Environment Variables (Production):
   - `PAYSTACK_SECRET_KEY` — Paystack → Settings → API Keys & Webhooks
     (`sk_test_…` first, later `sk_live_…`).
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API keys →
     secret / `service_role` key.
   - `PAYSTACK_RECEIPT_EMAIL` — the business email that should get receipts.
   - `SITE_URL` is already `https://zivarukah.com`.
   Then redeploy.
3. Paystack → Settings → API Keys & Webhooks → Webhook URL:
   `https://zivarukah.com/api/paystack/webhook`
4. Test with the test key, check Admin → Payments, then swap to the live key
   and redeploy.

Never paste these keys into chat, email or code.

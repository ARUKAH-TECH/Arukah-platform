# Online payments (Paystack)

Built and deployed, **switched off** until the owner adds the keys. While off,
the site works as before: book orders are paid by Mobile Money after we call,
and `/ministry/support` says online giving opens soon.

## What it does

- **Book orders** — after placing an order the customer sees "Pay with Mobile
  Money or card". The amount always comes from the database (order total +
  delivery fee − anything already paid), never from the browser.
- **Outreach support** — `/ministry/support` (linked from every outreach page):
  amount, optional outreach, name, email, message.
- Paystack sends the visitor back to `/payments/done`, and also calls
  `/api/paystack/webhook`. Both ask Paystack's verify API directly before
  recording anything, and check the currency (GHS) and exact amount. A payment
  is recorded once, however many times either is called.
- A successful book payment updates the order: amount paid, Part/Full paid, and
  "New" → "Paid" when fully paid.
- Admin → **Payments** lists paid gifts and orders (and all attempts).

## Switching it on (owner)

1. Create the Paystack account (Ghana) for the registered organisation and
   complete business verification.
2. Vercel → arukah-platform → Settings → Environment Variables, add
   (Production), then redeploy:
   - `PAYSTACK_SECRET_KEY` — Paystack → Settings → API Keys & Webhooks → Secret key
     (use the `sk_test_…` key first to try it, then the `sk_live_…` key).
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Project Settings → API keys →
     `service_role` / secret key. The database only lets this key read order
     totals and write payments.
   - `SITE_URL` is already set to `https://zivarukah.com`.
3. Paystack → Settings → API Keys & Webhooks → Webhook URL:
   `https://zivarukah.com/api/paystack/webhook`
4. Test with the test key and a Paystack test card/MoMo number, check Admin →
   Payments, then swap in the live key and redeploy.

Never paste these keys into chat, email or code.

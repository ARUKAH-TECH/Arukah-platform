-- Paystack's fee on each payment, so Admin → Payments can show what actually
-- reaches the owner's MoMo ("you receive" = amount − fee). Filled from
-- Paystack's own verify response; empty for payments not yet looked up.
alter table public.quick_payments add column if not exists fees_ghs numeric(12, 2) check (fees_ghs is null or fees_ghs >= 0);
alter table public.payments add column if not exists fees_ghs numeric(12, 2) check (fees_ghs is null or fees_ghs >= 0);

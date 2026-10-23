import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Paystack (Ghana): https://paystack.com/docs/api/transaction/
// PAYSTACK_SECRET_KEY is a server-only secret set in Vercel. It is never sent
// to the browser and never committed. Amounts go to Paystack in pesewas.

const API = "https://api.paystack.co";

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function authHeaders() {
  return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" };
}

export function toPesewas(ghs: number) {
  return Math.round(ghs * 100);
}

export async function initializeTransaction(input: {
  email: string;
  amountGhs: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<string> {
  const response = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email: input.email,
      amount: String(toPesewas(input.amountGhs)),
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: JSON.stringify(input.metadata),
    }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as { status?: boolean; message?: string; data?: { authorization_url?: string } } | null;
  const url = body?.data?.authorization_url;
  if (!response.ok || !body?.status || !url || !url.startsWith("https://")) {
    throw new Error(body?.message || `Paystack returned ${response.status}`);
  }
  return url;
}

export interface VerifiedTransaction {
  status: string; // "success" | "failed" | "abandoned" | ...
  amountPesewas: number;
  currency: string;
  reference: string;
  id: number | null;
  channel: string;
  paidAt: string | null;
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const response = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; amount?: number; currency?: string; reference?: string; id?: number; channel?: string; paid_at?: string | null };
  } | null;
  if (!response.ok || !body?.status || !body.data) throw new Error(body?.message || `Paystack returned ${response.status}`);
  return {
    status: String(body.data.status ?? ""),
    amountPesewas: Number(body.data.amount ?? 0),
    currency: String(body.data.currency ?? ""),
    reference: String(body.data.reference ?? ""),
    id: typeof body.data.id === "number" ? body.data.id : null,
    channel: String(body.data.channel ?? "").slice(0, 40),
    paidAt: body.data.paid_at ?? null,
  };
}

/** Webhook check: HMAC-SHA512 of the raw body with the secret key. */
export function signatureIsValid(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

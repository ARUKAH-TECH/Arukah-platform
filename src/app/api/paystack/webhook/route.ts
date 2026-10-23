import { signatureIsValid } from "@/server/paystack";
import { confirmPayment } from "@/server/payments";

// Paystack calls this after a payment (set the URL in the Paystack dashboard:
// Settings → API Keys & Webhooks → https://zivarukah.com/api/paystack/webhook).
// We check the signature, then ask Paystack directly before recording anything,
// so a forged call can't mark anything as paid.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!signatureIsValid(raw, request.headers.get("x-paystack-signature"))) {
    return new Response("invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } } | null = null;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("ok", { status: 200 });
  }

  const reference = event?.data?.reference;
  if (event?.event === "charge.success" && typeof reference === "string") {
    const result = await confirmPayment(reference);
    // Paystack retries when we don't answer 200 — useful if their verify
    // endpoint was briefly unreachable.
    if (result.state === "pending") return new Response("retry", { status: 503 });
  }
  return new Response("ok", { status: 200 });
}

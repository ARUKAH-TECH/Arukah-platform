import { confirmSubscription, LEARN_URL } from "@/server/literacySubs";

// Paystack sends the payer here after paying (?reference=ZL-…). We confirm
// with Paystack, then send them back to the app's account page.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = (url.searchParams.get("reference") ?? url.searchParams.get("trxref") ?? "").toUpperCase();
  const { state } = await confirmSubscription(reference);
  return Response.redirect(`${LEARN_URL}/account/?paid=${state}`, 303);
}

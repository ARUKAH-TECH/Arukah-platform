import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { initializeTransaction, toPesewas, verifyTransaction } from "@/server/paystack";
import { quickPaymentsEnabled } from "@/server/quickPayments";

// ZIVA Literacy monthly subscriptions (learn.zivarukah.com).
// The app creates a pending row (lit_sub_start, checks who is paying and the
// price). Here we open Paystack for exactly that amount, then confirm with
// Paystack before switching on one month (lit_sub_paid).

export const LIT_REF = /^ZL-[A-Z0-9]{10}$/;
export const LEARN_URL = "https://learn.zivarukah.com";
const PLAN_LABEL: Record<string, string> = {
  student: "ZIVA Literacy — student, 1 month",
  parent: "ZIVA Literacy — family, 1 month",
  school: "ZIVA Literacy — school, 1 month",
};

export async function startSubscription(reference: string): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!LIT_REF.test(reference)) return { ok: false, message: "Bad request." };
  if (!quickPaymentsEnabled()) return { ok: false, message: "Payments are not switched on yet." };
  const supabase = createServiceClient();
  const { data: row } = await supabase.from("lit_subscriptions").select("reference, plan, amount_ghs, status").eq("reference", reference).maybeSingle();
  if (!row || row.status !== "pending") return { ok: false, message: "This payment can't be started. Please try again." };
  try {
    const site = process.env.SITE_URL!.trim().replace(/\/$/, "");
    const url = await initializeTransaction({
      email: (process.env.PAYSTACK_RECEIPT_EMAIL ?? "").trim(),
      amountGhs: Number(row.amount_ghs),
      reference,
      callbackUrl: `${site}/api/literacy/subscribe/done`,
      metadata: { custom_fields: [{ display_name: "For", variable_name: "for", value: PLAN_LABEL[row.plan] ?? "ZIVA Literacy" }] },
    });
    return { ok: true, url };
  } catch (error) {
    console.error("[literacy-sub] initialize failed", error instanceof Error ? error.message : error);
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
}

/** Asks Paystack, then switches on the month once. Safe to call repeatedly. */
export async function confirmSubscription(reference: string): Promise<{ state: "paid" | "pending" | "failed" | "unknown" }> {
  if (!LIT_REF.test(reference) || !quickPaymentsEnabled()) return { state: "unknown" };
  const supabase = createServiceClient();
  const { data: row } = await supabase.from("lit_subscriptions").select("reference, amount_ghs, status").eq("reference", reference).maybeSingle();
  if (!row) return { state: "unknown" };
  if (row.status === "success") return { state: "paid" };
  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (error) {
    console.error("[literacy-sub] verify failed", error instanceof Error ? error.message : error);
    return { state: "pending" };
  }
  if (tx.status === "success") {
    if (tx.currency !== "GHS" || tx.amountPesewas !== toPesewas(Number(row.amount_ghs)) || tx.reference !== reference) {
      console.error("[literacy-sub] amount/currency mismatch", reference);
      return { state: "failed" };
    }
    const { error } = await supabase.rpc("lit_sub_paid", { p_ref: reference, p_paystack_id: tx.id, p_channel: tx.channel });
    if (error) {
      console.error("[literacy-sub] activate failed", error.message);
      return { state: "pending" };
    }
    return { state: "paid" };
  }
  if (tx.status === "failed" || tx.status === "abandoned") {
    await supabase.rpc("lit_sub_failed", { p_ref: reference, p_status: tx.status });
    return { state: "failed" };
  }
  return { state: "pending" };
}

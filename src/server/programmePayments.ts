import "server-only";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { initializeTransaction, verifyTransaction } from "@/server/paystack";
import { quickPaymentsEnabled } from "@/server/quickPayments";
import { platformName, scheduleText } from "@/features/programmes/shared";

// Paid programmes. The price always comes from the database (never the
// browser), Paystack's page takes the MoMo/card details, and a payment counts
// only after the server has asked Paystack itself (verify API) and the amount
// matches. Paystack receipts go to the owner's receipt email, as for books.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newReference() {
  return "ZP-" + Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function programmePaymentsEnabled() {
  return quickPaymentsEnabled();
}

/** Starts a Paystack payment for a registration the database just accepted. Returns Paystack's page. */
export async function startProgrammePayment(registrationId: string, amountGhs: number, title: string): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!programmePaymentsEnabled()) return { ok: false, message: "Online payment isn't available right now. Please contact us on WhatsApp." };
  const supabase = createServiceClient();
  const { data: reg } = await supabase.from("programme_registrations").select("id, programme_id, payment_status").eq("id", registrationId).maybeSingle();
  const { data: prog } = reg ? await supabase.from("programmes").select("price_ghs").eq("id", reg.programme_id).maybeSingle() : { data: null };
  // The amount is re-read from the database, not trusted from the caller.
  const amount = Number(prog?.price_ghs ?? 0);
  if (!reg || !(amount > 0) || Math.abs(amount - amountGhs) > 0.001 || reg.payment_status === "paid") {
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
  const reference = newReference();
  const { error } = await supabase.from("programme_payments").insert({ registration_id: reg.id, programme_id: reg.programme_id, reference, amount_ghs: amount });
  if (error) {
    console.error("[programme-pay] insert failed", error.message);
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
  try {
    const url = await initializeTransaction({
      email: (process.env.PAYSTACK_RECEIPT_EMAIL ?? "").trim(),
      amountGhs: amount,
      reference,
      callbackUrl: `${process.env.SITE_URL!.trim().replace(/\/$/, "")}/programmes/paid`,
      metadata: { custom_fields: [{ display_name: "Programme", variable_name: "programme", value: title.slice(0, 100) }] },
    });
    return { ok: true, url };
  } catch (error) {
    console.error("[programme-pay] initialize failed", error instanceof Error ? error.message : error);
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
}

export type ProgrammePayConfirm =
  | { state: "paid"; code?: string; title: string; slug: string; approved: boolean; when: string; where: string }
  | { state: "pending" | "failed" | "unknown" | "refunded" | "cancelled" };

/**
 * Asks Paystack about a payment and records it. With deliver = true (the
 * visitor's return page) the secret code is made and returned once; the
 * webhook passes false so the visitor still gets their code when they return.
 */
export async function confirmProgrammePayment(reference: string, deliver: boolean): Promise<ProgrammePayConfirm> {
  if (!/^ZP-[A-Z0-9]{10}$/.test(reference) || !programmePaymentsEnabled()) return { state: "unknown" };
  const supabase = createServiceClient();
  const { data: pay } = await supabase.from("programme_payments").select("id, status, registration_id, programme_id").eq("reference", reference).maybeSingle();
  if (!pay) return { state: "unknown" };
  if (pay.status === "refunded" || pay.status === "cancelled") return { state: pay.status };

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (error) {
    console.error("[programme-pay] verify failed", error instanceof Error ? error.message : error);
    return { state: "pending" };
  }
  if (tx.status === "failed" || tx.status === "abandoned") {
    await supabase.from("programme_payments").update({ status: tx.status, updated_at: new Date().toISOString() }).eq("id", pay.id).eq("status", "pending");
    await supabase.from("programme_registrations").update({ payment_status: "failed", updated_at: new Date().toISOString() }).eq("id", pay.registration_id).eq("payment_status", "pending");
    return { state: "failed" };
  }
  if (tx.status !== "success") return { state: "pending" };
  if (tx.currency !== "GHS" || tx.reference !== reference) {
    console.error("[programme-pay] currency/reference mismatch", reference);
    return { state: "failed" };
  }

  const { data, error } = await supabase.rpc("programme_payment_confirmed", {
    p_reference: reference,
    p_amount_pesewas: tx.amountPesewas,
    p_fees_pesewas: tx.feesPesewas,
    p_channel: tx.channel,
    p_tx: tx.id,
    p_paid_at: tx.paidAt,
    p_deliver: deliver,
  });
  if (error || !data) {
    console.error("[programme-pay] record failed", error?.message);
    return { state: "pending" };
  }
  const result = data as { state: string; code?: string };
  if (result.state === "mismatch") {
    console.error("[programme-pay] amount mismatch", reference);
    return { state: "failed" };
  }
  if (result.state !== "paid") return { state: "unknown" };

  const [{ data: prog }, { data: reg }] = await Promise.all([
    supabase.from("programmes").select("title, slug, starts_at, ends_at, time_zone, schedule_note, platform, platform_name").eq("id", pay.programme_id).maybeSingle(),
    supabase.from("programme_registrations").select("status").eq("id", pay.registration_id).maybeSingle(),
  ]);
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/programmes/${pay.programme_id}`);
  const when = prog ? scheduleText(prog.schedule_note, prog.starts_at, prog.ends_at, prog.time_zone) : "";
  const where = prog ? platformName(prog.platform, prog.platform_name) : "";
  return { state: "paid", code: result.code, title: prog?.title ?? "", slug: prog?.slug ?? "", approved: reg?.status === "approved", when, where };
}

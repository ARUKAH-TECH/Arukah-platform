import "server-only";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient, serviceKeyConfigured } from "@/lib/supabase/service";
import { initializeTransaction, paystackConfigured, toPesewas, verifyTransaction } from "@/server/paystack";

/**
 * Online payments are switched on only when all three settings exist in
 * Vercel: PAYSTACK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY and SITE_URL.
 * Until then the site keeps working exactly as before (pay by MoMo/contact).
 */
export function paymentsEnabled() {
  return paystackConfigured() && serviceKeyConfigured() && Boolean(process.env.SITE_URL?.trim());
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newReference() {
  const bytes = randomBytes(10);
  return "ZP-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function callbackUrl() {
  return `${process.env.SITE_URL!.trim().replace(/\/$/, "")}/payments/done`;
}

export type StartResult = { ok: true; url: string } | { ok: false; message: string };

function friendly(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  return /several requests|a lot of requests/i.test(message) ? message : "Payment couldn't be started. Please try again.";
}

/** Starts paying (the rest of) a book order. The amount always comes from the database. */
export async function startBookOrderPayment(orderReference: string, email: string): Promise<StartResult> {
  if (!paymentsEnabled()) return { ok: false, message: "Online payment isn't available yet." };
  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("book_orders")
    .select("id, reference, customer_name, phone, total_ghs, delivery_fee_ghs, status, payment_status, amount_paid_ghs")
    .eq("reference", orderReference)
    .maybeSingle();
  if (!order || order.status === "cancelled") return { ok: false, message: "We couldn't find that order." };

  const due = Number(order.total_ghs) + Number(order.delivery_fee_ghs) - Number(order.amount_paid_ghs ?? 0);
  if (order.payment_status === "full" || due < 1) return { ok: false, message: "This order is already paid. Thank you!" };

  const reference = newReference();
  const { error } = await supabase.from("payments").insert({
    reference,
    purpose: "book_order",
    book_order_id: order.id,
    payer_name: order.customer_name,
    email,
    phone: order.phone,
    amount_ghs: Math.round(due * 100) / 100,
  });
  if (error) {
    console.error("[payments] insert failed", error.message);
    return { ok: false, message: friendly(error) };
  }

  try {
    const url = await initializeTransaction({
      email,
      amountGhs: due,
      reference,
      callbackUrl: callbackUrl(),
      metadata: {
        purpose: "book_order",
        order: order.reference,
        custom_fields: [{ display_name: "Book order", variable_name: "order", value: order.reference }],
      },
    });
    return { ok: true, url };
  } catch (error) {
    console.error("[payments] initialize failed", error instanceof Error ? error.message : error);
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
}

/** Starts a gift towards the outreach work. */
export async function startSupportPayment(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  amountGhs: number;
  outreachId: string | null;
  outreachTitle: string | null;
}): Promise<StartResult> {
  if (!paymentsEnabled()) return { ok: false, message: "Online giving isn't available yet." };
  const supabase = createServiceClient();
  const reference = newReference();
  const { error } = await supabase.from("payments").insert({
    reference,
    purpose: "outreach_support",
    outreach_id: input.outreachId,
    payer_name: input.name,
    email: input.email,
    phone: input.phone,
    message: input.message,
    amount_ghs: input.amountGhs,
  });
  if (error) {
    console.error("[payments] insert failed", error.message);
    return { ok: false, message: friendly(error) };
  }
  try {
    const url = await initializeTransaction({
      email: input.email,
      amountGhs: input.amountGhs,
      reference,
      callbackUrl: callbackUrl(),
      metadata: {
        purpose: "outreach_support",
        custom_fields: [
          { display_name: "Supporting", variable_name: "supporting", value: input.outreachTitle ?? "Outreach work (general)" },
        ],
      },
    });
    return { ok: true, url };
  } catch (error) {
    console.error("[payments] initialize failed", error instanceof Error ? error.message : error);
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
}

export type ConfirmResult =
  | { state: "paid"; purpose: string; amountGhs: number; orderReference: string | null }
  | { state: "pending" | "failed" | "unknown" };

/**
 * Asks Paystack directly whether the payment succeeded, and records it once.
 * Safe to call any number of times (from the return page AND the webhook):
 * only the first call that finds the payment still "pending" changes anything.
 */
export async function confirmPayment(reference: string): Promise<ConfirmResult> {
  if (!/^ZP-[A-Z0-9]{10}$/.test(reference) || !paymentsEnabled()) return { state: "unknown" };
  const supabase = createServiceClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, purpose, book_order_id, amount_ghs, status")
    .eq("reference", reference)
    .maybeSingle();
  if (!payment) return { state: "unknown" };

  const orderReference = async () => {
    if (!payment.book_order_id) return null;
    const { data } = await supabase.from("book_orders").select("reference").eq("id", payment.book_order_id).maybeSingle();
    return data?.reference ?? null;
  };

  if (payment.status === "success") {
    return { state: "paid", purpose: payment.purpose, amountGhs: Number(payment.amount_ghs), orderReference: await orderReference() };
  }

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (error) {
    console.error("[payments] verify failed", error instanceof Error ? error.message : error);
    return { state: "pending" };
  }

  const expected = toPesewas(Number(payment.amount_ghs));
  if (tx.status === "success") {
    if (tx.currency !== "GHS" || tx.amountPesewas !== expected || tx.reference !== reference) {
      console.error("[payments] amount/currency mismatch", reference, tx.currency, tx.amountPesewas, expected);
      return { state: "failed" };
    }
    const { data: updated } = await supabase
      .from("payments")
      .update({
        status: "success",
        paystack_transaction_id: tx.id,
        channel: tx.channel,
        paid_at: tx.paidAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .neq("status", "success")
      .select("id");

    // Only the call that flipped it to success updates the order.
    if (updated?.length && payment.book_order_id) {
      const { data: order } = await supabase
        .from("book_orders")
        .select("total_ghs, delivery_fee_ghs, status, amount_paid_ghs")
        .eq("id", payment.book_order_id)
        .maybeSingle();
      if (order) {
        const paid = Math.round((Number(order.amount_paid_ghs ?? 0) + Number(payment.amount_ghs)) * 100) / 100;
        const full = paid >= Number(order.total_ghs) + Number(order.delivery_fee_ghs);
        await supabase
          .from("book_orders")
          .update({
            amount_paid_ghs: paid,
            payment_status: full ? "full" : "part",
            payment_reference: `Paystack ${reference}`,
            status: order.status === "new" && full ? "paid" : order.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.book_order_id);
      }
    }
    revalidatePath("/admin/payments");
    return { state: "paid", purpose: payment.purpose, amountGhs: Number(payment.amount_ghs), orderReference: await orderReference() };
  }

  if (tx.status === "failed" || tx.status === "abandoned") {
    await supabase
      .from("payments")
      .update({ status: tx.status, updated_at: new Date().toISOString() })
      .eq("id", payment.id)
      .eq("status", "pending");
    return { state: "failed" };
  }
  return { state: "pending" };
}

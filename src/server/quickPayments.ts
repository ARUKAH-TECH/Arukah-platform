import "server-only";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { BOOK_FORMATS, type BookFormat } from "@/config/books";
import { getPublishedBook } from "@/db/books";
import { getPublicOutreaches } from "@/db/outreaches";
import { createServiceClient, serviceKeyConfigured } from "@/lib/supabase/service";
import { initializeTransaction, paystackConfigured, toPesewas, verifyTransaction } from "@/server/paystack";

// "Quantity → pay" payments. The visitor gives us nothing: they choose a book
// and quantity (or a gift amount) and type their MoMo number or card on
// Paystack's own page. Paystack needs an email for every payment, so we send
// the owner's business email (PAYSTACK_RECEIPT_EMAIL) — receipts go there.
//
// Switched on only when PAYSTACK_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY,
// PAYSTACK_RECEIPT_EMAIL and SITE_URL are all set in Vercel.

export function quickPaymentsEnabled() {
  return (
    paystackConfigured() &&
    serviceKeyConfigured() &&
    Boolean(process.env.SITE_URL) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.PAYSTACK_RECEIPT_EMAIL ?? "")
  );
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newReference() {
  return "ZS-" + Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function callbackUrl() {
  return `${process.env.SITE_URL!.replace(/\/$/, "")}/payments/done`;
}

export type QuickStart = { ok: true; url: string } | { ok: false; message: string };

async function start(row: Record<string, unknown>, amountGhs: number, label: string): Promise<QuickStart> {
  const reference = newReference();
  const supabase = createServiceClient();
  const { error } = await supabase.from("quick_payments").insert({ ...row, reference, amount_ghs: amountGhs });
  if (error) {
    console.error("[quick-pay] insert failed", error.message);
    return { ok: false, message: /a lot of requests/i.test(error.message) ? error.message : "Payment couldn't be started. Please try again." };
  }
  try {
    const url = await initializeTransaction({
      email: process.env.PAYSTACK_RECEIPT_EMAIL!,
      amountGhs,
      reference,
      callbackUrl: callbackUrl(),
      metadata: { custom_fields: [{ display_name: "For", variable_name: "for", value: label }] },
    });
    return { ok: true, url };
  } catch (error) {
    console.error("[quick-pay] initialize failed", error instanceof Error ? error.message : error);
    return { ok: false, message: "Payment couldn't be started. Please try again." };
  }
}

/** Price always comes from the catalogue; 10% off for more than 3 copies. */
export async function startBookPayment(slug: string, format: BookFormat, quantity: number): Promise<QuickStart> {
  if (!quickPaymentsEnabled()) return { ok: false, message: "Online payment isn't available yet. Please order on WhatsApp." };
  const book = await getPublishedBook(slug);
  const price = book?.prices.find((p) => p.format === format);
  if (!book || !price) return { ok: false, message: "That book or format isn't available." };
  const qty = Math.max(1, Math.min(50, Math.round(quantity)));
  const subtotal = price.amount * qty;
  const amount = Math.round((qty > 3 ? subtotal * 0.9 : subtotal) * 100) / 100;
  if (amount < 1) return { ok: false, message: "This item can't be paid for online." };
  const formatLabel = BOOK_FORMATS.find((f) => f.id === format)?.label ?? format;
  return start(
    { kind: "book", book_id: book.id, book_title: book.title, book_format: format, quantity: qty },
    amount,
    `${qty} × ${book.title} (${formatLabel})`,
  );
}

export async function startGiftPayment(amountGhs: number, outreachId: string): Promise<QuickStart> {
  if (!quickPaymentsEnabled()) return { ok: false, message: "Online giving isn't available yet. Please use WhatsApp." };
  const amount = Math.round(amountGhs * 100) / 100;
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return { ok: false, message: "Please enter an amount between GHS 1 and GHS 100,000." };
  }
  let outreach: { id: string; title: string } | null = null;
  if (outreachId) {
    const found = (await getPublicOutreaches(200)).find((o) => o.id === outreachId);
    if (!found) return { ok: false, message: "Please choose an outreach from the list." };
    outreach = { id: found.id, title: found.title };
  }
  return start(
    { kind: "gift", outreach_id: outreach?.id ?? null, outreach_title: outreach?.title ?? "" },
    amount,
    outreach ? `Gift — ${outreach.title}` : "Gift — outreach work",
  );
}

export type QuickConfirm =
  | {
      state: "paid";
      kind: "book" | "gift";
      amountGhs: number;
      bookTitle: string;
      bookFormat: string | null;
      quantity: number | null;
      outreachTitle: string;
    }
  | { state: "pending" | "failed" | "unknown" };

/** Asks Paystack directly; records the payment once. Safe to call repeatedly. */
export async function confirmQuickPayment(reference: string): Promise<QuickConfirm> {
  if (!/^ZS-[A-Z0-9]{10}$/.test(reference) || !quickPaymentsEnabled()) return { state: "unknown" };
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("quick_payments")
    .select("id, kind, amount_ghs, status, book_title, book_format, quantity, outreach_title")
    .eq("reference", reference)
    .maybeSingle();
  if (!row) return { state: "unknown" };

  const paid = (): QuickConfirm => ({
    state: "paid",
    kind: row.kind,
    amountGhs: Number(row.amount_ghs),
    bookTitle: row.book_title,
    bookFormat: row.book_format,
    quantity: row.quantity,
    outreachTitle: row.outreach_title,
  });
  if (row.status === "success") return paid();

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (error) {
    console.error("[quick-pay] verify failed", error instanceof Error ? error.message : error);
    return { state: "pending" };
  }

  if (tx.status === "success") {
    if (tx.currency !== "GHS" || tx.amountPesewas !== toPesewas(Number(row.amount_ghs)) || tx.reference !== reference) {
      console.error("[quick-pay] amount/currency mismatch", reference);
      return { state: "failed" };
    }
    await supabase
      .from("quick_payments")
      .update({
        status: "success",
        paystack_transaction_id: tx.id,
        channel: tx.channel,
        paid_at: tx.paidAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .neq("status", "success");
    revalidatePath("/admin/payments");
    return paid();
  }
  if (tx.status === "failed" || tx.status === "abandoned") {
    await supabase
      .from("quick_payments")
      .update({ status: tx.status, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "pending");
    return { state: "failed" };
  }
  return { state: "pending" };
}

/**
 * For a paid "Read online" / "Digital download" purchase: a link to the book
 * PDF that works for one hour. Available for 30 days after payment, so the
 * buyer can come back to the same page (bookmark) to open it again.
 */
export async function bookFileLink(reference: string): Promise<{ url: string; download: boolean } | null> {
  if (!/^ZS-[A-Z0-9]{10}$/.test(reference) || !quickPaymentsEnabled()) return null;
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from("quick_payments")
    .select("kind, status, book_id, book_format, paid_at")
    .eq("reference", reference)
    .maybeSingle();
  if (!row || row.kind !== "book" || row.status !== "success" || !row.book_id) return null;
  if (row.book_format !== "read" && row.book_format !== "download") return null;
  if (row.paid_at && Date.now() - new Date(row.paid_at).getTime() > 30 * 24 * 3600 * 1000) return null;
  const { data: book } = await supabase.from("books").select("book_file_path, book_file_name").eq("id", row.book_id).maybeSingle();
  if (!book?.book_file_path) return null;
  const download = row.book_format === "download";
  const name = (book.book_file_name || "book.pdf").replace(/[^\w .()-]/g, "_");
  const { data, error } = await supabase.storage
    .from("book-files")
    .createSignedUrl(book.book_file_path, 3600, download ? { download: name } : undefined);
  if (error || !data?.signedUrl) {
    console.error("[quick-pay] signed link failed", error?.message);
    return null;
  }
  return { url: data.signedUrl, download };
}

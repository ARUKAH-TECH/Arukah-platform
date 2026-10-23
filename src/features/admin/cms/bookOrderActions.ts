"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import type { CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;
const STATUSES = ["new", "paid", "printing", "ready", "shipped", "delivered", "cancelled"];

function money(raw: string): number | null | "invalid" {
  const value = raw.trim().replace(/,/g, "");
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : "invalid";
}

export async function updateBookOrder(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "");
  const amountPaid = money(String(formData.get("amountPaid") ?? ""));
  const deliveryFee = money(String(formData.get("deliveryFee") ?? ""));
  if (!UUID.test(id)) return { status: "error", message: "Unknown order." };
  if (!STATUSES.includes(status)) return { status: "error", message: "Choose the order's progress." };
  if (!["unpaid", "part", "full"].includes(paymentStatus)) return { status: "error", message: "Choose how much has been paid." };
  if (amountPaid === "invalid" || deliveryFee === "invalid") return { status: "error", message: "Amounts must be numbers, e.g. 120 or 120.50." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("book_orders")
    .update({
      status,
      payment_status: paymentStatus,
      amount_paid_ghs: amountPaid,
      delivery_fee_ghs: deliveryFee ?? 0,
      payment_reference: String(formData.get("paymentReference") ?? "").trim().slice(0, 200),
      admin_note: String(formData.get("adminNote") ?? "").trim().slice(0, 2000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] updateBookOrder failed", error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }
  await audit("book_order.update", { id, status, paymentStatus });
  revalidatePath("/admin/book-orders");
  revalidatePath(`/admin/book-orders/${id}`);
  revalidatePath("/admin");
  return { status: "saved", message: "Saved." };
}

export async function deleteBookOrder(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("book_orders").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteBookOrder failed", error.message);
    return;
  }
  await audit("book_order.delete", { id });
  revalidatePath("/admin/book-orders");
  revalidatePath("/admin");
  redirect("/admin/book-orders");
}

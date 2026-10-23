"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";

/** Ticks a paid book as sent/collected (or un-ticks it). */
export async function setDelivered(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const delivered = formData.get("delivered") === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("quick_payments")
    .update({ delivered, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("[quick-pay] mark delivered failed", error.message);
  revalidatePath("/admin/payments");
}

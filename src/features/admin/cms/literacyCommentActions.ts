"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/auth";

// Approve / hide / reply to comments posted in the ZIVA Literacy app.
// Approved comments become visible to everyone in the app (first name only).

const ID = /^[0-9a-f-]{36}$/;

export async function moderateLiteracyComment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const reply = String(formData.get("reply") ?? "").trim().slice(0, 600);
  if (!ID.test(id)) return;
  const supabase = await createClient();
  const update: Record<string, unknown> = { reviewed_at: new Date().toISOString() };
  if (action === "approve") update.status = "approved";
  else if (action === "hide") update.status = "hidden";
  else if (action === "reply") update.reply = reply || null;
  else return;
  const { error } = await supabase.from("lit_comments").update(update).eq("id", id);
  if (error) console.error("[literacy-comments] update failed", error.message);
  revalidatePath("/admin/literacy-comments");
}

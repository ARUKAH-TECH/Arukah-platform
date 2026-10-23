"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import type { CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;
const STATUSES = ["new", "in_progress", "handled"];

export async function updateInboxMessage(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("adminNote") ?? "").trim().slice(0, 2000);
  if (!UUID.test(id)) return { status: "error", message: "Unknown message." };
  if (!STATUSES.includes(status)) return { status: "error", message: "Choose a status." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inbox_messages")
    .update({ status, admin_note: note, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("[admin] updateInboxMessage failed", error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }
  // The audit log records that something changed, never the message content.
  await audit("inbox.update", { id, status });
  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/inbox/${id}`);
  revalidatePath("/admin");
  return { status: "saved", message: "Saved." };
}

export async function deleteInboxMessage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("inbox_messages").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteInboxMessage failed", error.message);
    return;
  }
  await audit("inbox.delete", { id });
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  redirect("/admin/inbox");
}

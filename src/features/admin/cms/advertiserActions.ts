"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import type { CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;
const DECISIONS = ["pending", "approved", "rejected"] as const;

/** Approve / reject (or move back to pending) and keep a private note. */
export async function reviewAdvertiser(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("decision") ?? "") as (typeof DECISIONS)[number];
  const note = String(formData.get("reviewNote") ?? "").trim().slice(0, 2000);
  if (!UUID.test(id)) return { status: "error", message: "Unknown application." };
  if (!DECISIONS.includes(status)) return { status: "error", message: "Choose a decision." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("advertisers")
    .update({
      status,
      review_note: note,
      reviewed_by: status === "pending" ? null : admin.userId,
      reviewed_at: status === "pending" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] reviewAdvertiser failed", error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  await audit("advertiser.review", { id, status });
  revalidatePath("/admin/advertisers");
  revalidatePath(`/admin/advertisers/${id}`);
  const label = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Moved back to pending";
  return { status: "saved", message: `${label}. Saved.` };
}

export async function deleteAdvertiser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("advertisers").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteAdvertiser failed", error.message);
    // 23503: adverts still belong to this advertiser (kept on purpose).
    redirect(`/admin/advertisers/${id}?error=${error.code === "23503" ? "has-ads" : "delete"}`);
  }
  await audit("advertiser.delete", { id });
  revalidatePath("/admin/advertisers");
  redirect("/admin/advertisers");
}

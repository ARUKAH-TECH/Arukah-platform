"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/auth";

// Nursing class sign-ups: tick as checked (seen in the WhatsApp group) or remove spam.

const ID = /^[0-9a-f-]{36}$/;

export async function updateNursingSignup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!ID.test(id)) return;
  const supabase = await createClient();
  const { error } =
    action === "remove"
      ? await supabase.from("nursing_signups").delete().eq("id", id)
      : action === "check" || action === "uncheck"
        ? await supabase.from("nursing_signups").update({ checked: action === "check" }).eq("id", id)
        : { error: null };
  if (error) console.error("[nursing-signups] update failed", error.message);
  revalidatePath("/admin/nursing-class");
  revalidatePath("/admin");
}

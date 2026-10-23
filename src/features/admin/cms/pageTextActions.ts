"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { allFields, findPage } from "@/config/pages";
import type { CmsFormState } from "@/features/admin/cms/shared";

/**
 * Saves only the fields that differ from the original wording. A field left
 * blank (or set back to the original) is simply not stored, so the page shows
 * the original wording for it.
 */
export async function savePageText(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();
  const page = findPage(String(formData.get("page") ?? ""));
  if (!page) return { status: "error", message: "Unknown page." };

  const content: Record<string, string | string[]> = {};
  for (const field of allFields(page)) {
    const raw = String(formData.get(field.key) ?? "").replace(/\r\n/g, "\n").trim();
    if (!raw) continue;

    if (field.kind === "list") {
      const items = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const limit = field.maxItems ?? 12;
      if (items.length > limit) {
        return { status: "error", message: `“${field.label}” can have at most ${limit} lines.` };
      }
      const tooLong = items.find((item) => item.length > field.max);
      if (tooLong) {
        return { status: "error", message: `A line in “${field.label}” is longer than ${field.max} characters.` };
      }
      if (JSON.stringify(items) !== JSON.stringify(field.default)) content[field.key] = items;
    } else {
      // Single-line fields never keep line breaks.
      const value = field.kind === "text" ? raw.replace(/\s*\n\s*/g, " ") : raw;
      if (value.length > field.max) {
        return { status: "error", message: `“${field.label}” is longer than ${field.max} characters.` };
      }
      if (value !== field.default) content[field.key] = value;
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("page_content")
    .upsert({ page: page.id, content, updated_by: admin.userId, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[admin] savePageText failed", error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  await audit("page_text.update", { page: page.id, changedFields: Object.keys(content) });
  revalidatePath(page.path);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${page.id}`);
  return { status: "saved", message: "Saved. The page shows the new text now." };
}

/** Puts every field on the page back to its original wording. */
export async function resetPageText(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const page = findPage(String(formData.get("page") ?? ""));
  if (!page) return { status: "error", message: "Unknown page." };

  const supabase = await createClient();
  const { error } = await supabase.from("page_content").delete().eq("page", page.id);
  if (error) {
    console.error("[admin] resetPageText failed", error.message);
    return { status: "error", message: "Couldn't reset. Please try again." };
  }

  await audit("page_text.reset", { page: page.id });
  revalidatePath(page.path);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${page.id}`);
  return { status: "saved", message: "Reset. The page shows the original wording again." };
}

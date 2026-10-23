"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { slugify, type CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;
const COVER = /^books\/[0-9a-f-]{36}\.webp$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

/** "" → null (format not offered); otherwise a non-negative amount, or "invalid". */
function price(formData: FormData, key: string): number | null | "invalid" {
  const raw = text(formData, key, 20).replace(/,/g, "");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return "invalid";
  return Math.round(value * 100) / 100;
}

function revalidateBooks(slug?: string) {
  revalidatePath("/books");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/books");
  if (slug) revalidatePath(`/books/${slug}`);
}

export async function saveBook(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();
  const id = text(formData, "id", 64) || null;
  const title = text(formData, "title", 200);
  const slug = slugify(text(formData, "slug", 80) || title);
  const status = text(formData, "status", 20);
  const coverPath = text(formData, "coverPath", 120) || null;
  const prices = {
    price_read_ghs: price(formData, "priceRead"),
    price_download_ghs: price(formData, "priceDownload"),
    price_print_ghs: price(formData, "pricePrint"),
  };

  if (!title) return { status: "error", message: "Give the book a title." };
  if (!slug) return { status: "error", message: "The web address needs at least one letter or number." };
  if (!["draft", "published", "archived"].includes(status)) return { status: "error", message: "Choose a status." };
  if (coverPath && !COVER.test(coverPath)) return { status: "error", message: "Upload the cover again, please." };
  if (Object.values(prices).includes("invalid")) return { status: "error", message: "Prices must be numbers, e.g. 45 or 45.50." };
  if (status === "published" && Object.values(prices).every((value) => value === null)) {
    return { status: "error", message: "Set at least one price before publishing." };
  }

  const row = {
    title,
    slug,
    author: text(formData, "author", 150),
    description: text(formData, "description", 10000),
    sample_text: text(formData, "sampleText", 20000),
    cover_path: coverPath,
    cover_width: coverPath ? Number(formData.get("coverWidth")) || null : null,
    cover_height: coverPath ? Number(formData.get("coverHeight")) || null : null,
    ...prices,
    status,
    sort_order: Math.round(Number(formData.get("sortOrder")) || 0),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const previous = id
    ? (await supabase.from("books").select("cover_path, slug").eq("id", id).maybeSingle()).data
    : null;
  const result = id
    ? await supabase.from("books").update(row).eq("id", id).select("id").single()
    : await supabase.from("books").insert({ ...row, created_by: admin.userId }).select("id").single();
  if (result.error) {
    if (result.error.code === "23505") return { status: "error", message: "Another book already uses that web address." };
    console.error("[admin] saveBook failed", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }
  if (previous?.cover_path && previous.cover_path !== coverPath) {
    await supabase.storage.from("media").remove([previous.cover_path]);
  }

  await audit(id ? "book.update" : "book.create", { id: result.data.id, slug, status });
  revalidateBooks(slug);
  if (previous?.slug && previous.slug !== slug) revalidatePath(`/books/${previous.slug}`);
  if (!id) redirect(`/admin/books/${result.data.id}?saved=1`);
  return { status: "saved", message: status === "published" ? "Saved. It's on the Books page." : "Saved." };
}

export async function deleteBook(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select("cover_path, slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteBook failed", error.message);
    return;
  }
  if (book?.cover_path) await supabase.storage.from("media").remove([book.cover_path]);
  await audit("book.delete", { id });
  revalidateBooks(book?.slug);
  redirect("/admin/books");
}

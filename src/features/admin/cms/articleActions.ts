"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { slugify, type CmsFormState } from "@/features/admin/cms/shared";
import { safeHref, safeImage } from "@/lib/articleMarkup";

// Every action re-checks the admin on the server (requireAdmin), and the
// database's Row Level Security independently refuses writes from anyone
// who isn't a verified admin.

const UUID = /^[0-9a-f-]{36}$/;
const IMAGE = /^articles\/[0-9a-f-]{36}\.webp$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function revalidateArticles(...slugs: (string | null | undefined)[]) {
  revalidatePath("/articles");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/articles");
  for (const slug of slugs) if (slug) revalidatePath(`/articles/${slug}`);
}

/** Problems in the article text that the reader would otherwise silently drop. */
function contentProblem(content: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^)\s]*)\)/g)) {
    if (!safeImage(match[1], base)) return "An image in the text isn't one you uploaded here. Use the 📷 Image button to add pictures.";
  }
  for (const match of content.matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]*)\)/g)) {
    if (!safeHref(match[1])) return `This link can't be used: ${match[1].slice(0, 60)} — links must start with https:// (or be a page like /books).`;
  }
  return null;
}

export async function saveArticle(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();
  const id = text(formData, "id", 64) || null;
  if (id && !UUID.test(id)) return { status: "error", message: "Unknown article." };
  const intent = text(formData, "intent", 20); // draft | publish | unpublish
  if (!["draft", "publish", "unpublish"].includes(intent)) return { status: "error", message: "Choose Save draft or Publish." };

  const title = text(formData, "title", 200);
  const slug = slugify(text(formData, "slug", 100) || title).slice(0, 100).replace(/-+$/, "");
  const excerpt = text(formData, "excerpt", 400);
  const content = String(formData.get("content") ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, 100000);
  const categoryId = text(formData, "categoryId", 64) || null;
  const imagePath = text(formData, "imagePath", 120) || null;

  if (!title) return { status: "error", message: "Give the article a title." };
  if (!slug) return { status: "error", message: "The web address needs at least one letter or number." };
  if (categoryId && !UUID.test(categoryId)) return { status: "error", message: "Choose a category from the list." };
  if (imagePath && !IMAGE.test(imagePath)) return { status: "error", message: "Upload the featured image again, please." };
  const problem = contentProblem(content);
  if (problem) return { status: "error", message: problem };
  if (intent === "publish") {
    if (!content.trim()) return { status: "error", message: "Write the article before publishing." };
    if (!categoryId) return { status: "error", message: "Choose a category before publishing." };
    if (imagePath && !text(formData, "imageAlt", 300)) {
      return { status: "error", message: "Describe the featured image (alt text) before publishing — it helps blind readers and Google." };
    }
  }

  const supabase = await createClient();
  const previous = id
    ? (await supabase.from("articles").select("slug, status, published_at, featured_image_path").eq("id", id).maybeSingle()).data
    : null;
  if (id && !previous) return { status: "error", message: "This article no longer exists." };

  const now = new Date().toISOString();
  let status = previous?.status ?? "draft";
  let publishedAt: string | null = previous?.published_at ?? null;
  if (intent === "publish") {
    status = "published";
    // Publishing sets the date; updating an already-live article keeps it.
    publishedAt = previous?.status === "published" && publishedAt ? publishedAt : now;
  } else if (intent === "unpublish") {
    status = "draft";
  }

  const row = {
    title,
    slug,
    excerpt,
    content,
    category_id: categoryId,
    featured_image_path: imagePath,
    featured_image_alt: imagePath ? text(formData, "imageAlt", 300) : "",
    featured_width: imagePath ? Math.round(Number(formData.get("imageWidth")) || 0) || null : null,
    featured_height: imagePath ? Math.round(Number(formData.get("imageHeight")) || 0) || null : null,
    author_name: text(formData, "authorName", 120),
    seo_title: text(formData, "seoTitle", 120),
    meta_description: text(formData, "metaDescription", 300),
    status,
    published_at: publishedAt,
    updated_at: now,
  };

  const result = id
    ? await supabase.from("articles").update(row).eq("id", id).select("id").single()
    : await supabase.from("articles").insert({ ...row, created_by: admin.userId }).select("id").single();
  if (result.error) {
    if (result.error.code === "23505") return { status: "error", message: "Another article already uses that web address. Change the web address." };
    if (result.error.code === "23503") return { status: "error", message: "That category no longer exists. Choose another." };
    console.error("[admin] saveArticle failed", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  // A replaced featured image is no longer needed.
  if (previous?.featured_image_path && previous.featured_image_path !== imagePath) {
    await supabase.storage.from("media").remove([previous.featured_image_path]);
  }

  await audit(id ? `article.${intent}` : `article.create.${intent}`, { id: result.data.id, slug, status });
  revalidateArticles(slug, previous?.slug !== slug ? previous?.slug : null);
  revalidatePath(`/admin/articles/${result.data.id}`);

  const message =
    intent === "publish"
      ? previous?.status === "published"
        ? "Updated. The live article now shows these changes."
        : "Published! Visitors can now read it."
      : intent === "unpublish"
        ? "Unpublished. It's hidden from visitors and saved as a draft."
        : "Draft saved. Visitors can't see it.";
  if (!id) redirect(`/admin/articles/${result.data.id}?saved=${intent}`);
  return { status: "saved", message };
}

export async function deleteArticle(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: article } = await supabase.from("articles").select("slug, featured_image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteArticle failed", error.message);
    return;
  }
  if (article?.featured_image_path) await supabase.storage.from("media").remove([article.featured_image_path]);
  await audit("article.delete", { id, slug: article?.slug });
  revalidateArticles(article?.slug);
  redirect("/admin/articles?deleted=1");
}

export async function addCategory(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name", 80);
  const slug = slugify(name).slice(0, 60);
  if (!name || !slug) return;
  const supabase = await createClient();
  const { count } = await supabase.from("article_categories").select("id", { count: "exact", head: true });
  const { error } = await supabase.from("article_categories").insert({ name, slug, sort_order: (count ?? 0) + 1 });
  if (error) console.error("[admin] addCategory failed", error.message);
  else await audit("article_category.add", { name });
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("article_categories").delete().eq("id", id);
  if (error) console.error("[admin] deleteCategory failed", error.message);
  else await audit("article_category.delete", { id });
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
}

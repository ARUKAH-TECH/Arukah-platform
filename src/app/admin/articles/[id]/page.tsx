import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { ArticleForm } from "@/features/admin/cms/ArticleForm";
import { deleteArticle } from "@/features/admin/cms/articleActions";

export const metadata: Metadata = { title: "Edit article" };

const SAVED: Record<string, string> = {
  draft: "Draft saved. Visitors can't see it.",
  publish: "Published! Visitors can now read it.",
};

export default async function EditArticlePage({ params, searchParams }: PageProps<"/admin/articles/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: a }, { data: categories }] = await Promise.all([
    supabase
      .from("articles")
      .select(
        "id, slug, title, excerpt, content, category_id, featured_image_path, featured_image_alt, featured_width, featured_height, author_name, seo_title, meta_description, status, published_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("article_categories").select("id, name, slug").order("sort_order").order("name"),
  ]);
  if (!a) notFound();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/articles" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All articles
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit article</h1>
      <div className="mt-6 max-w-3xl">
        <ArticleForm
          key={`${a.id}-${a.status}`}
          categories={categories ?? []}
          savedMessage={typeof saved === "string" ? SAVED[saved] : undefined}
          article={{
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            content: a.content,
            categoryId: a.category_id,
            imagePath: a.featured_image_path,
            imageAlt: a.featured_image_alt,
            imageWidth: a.featured_width,
            imageHeight: a.featured_height,
            authorName: a.author_name,
            seoTitle: a.seo_title,
            metaDescription: a.meta_description,
            status: a.status === "published" ? "published" : "draft",
            publishedAt: a.published_at,
          }}
        />
      </div>
      <section className="mt-12 max-w-3xl border-t border-black/10 pt-8 pb-24 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this article…</summary>
          <p className="mt-2 text-xs text-foreground/60">This can&apos;t be undone. To hide it but keep it, use Unpublish instead.</p>
          <form action={deleteArticle} className="mt-3">
            <input type="hidden" name="id" value={a.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}

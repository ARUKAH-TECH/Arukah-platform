import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { mediaPublicUrl } from "@/lib/supabase/public";
import { ArticleView } from "@/features/articles/ArticleView";

export const metadata: Metadata = { title: "Preview article", robots: { index: false } };

/** The saved version exactly as visitors will see it — drafts included (admins only). */
export default async function PreviewArticlePage({ params }: PageProps<"/admin/articles/[id]/preview">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, content, featured_image_path, featured_image_alt, featured_width, featured_height, author_name, status, published_at, updated_at, article_categories(slug, name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();
  const cat = (Array.isArray(a.article_categories) ? a.article_categories[0] : a.article_categories) as { slug: string; name: string } | null;
  const live = a.status === "published";

  return (
    <ArticleView
      banner={
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
          <span>
            <strong>Preview</strong>: {live ? "this article is published." : "this is a draft; visitors can't see it."}
          </span>
          <Link href={`/admin/articles/${a.id}`} className="font-semibold underline">
            ← Back to editing
          </Link>
        </div>
      }
      article={{
        title: a.title,
        excerpt: a.excerpt,
        content: a.content,
        authorName: a.author_name,
        publishedAt: a.published_at,
        updatedAt: a.updated_at,
        category: cat,
        image: a.featured_image_path
          ? { url: mediaPublicUrl(a.featured_image_path), alt: a.featured_image_alt, width: a.featured_width, height: a.featured_height }
          : null,
      }}
    />
  );
}

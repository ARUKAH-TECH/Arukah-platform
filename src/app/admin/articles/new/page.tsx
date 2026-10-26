import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { ArticleForm } from "@/features/admin/cms/ArticleForm";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: categories }, { data: last }] = await Promise.all([
    supabase.from("article_categories").select("id, name, slug").order("sort_order").order("name"),
    supabase.from("articles").select("author_name").neq("author_name", "").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/articles" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All articles
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New article</h1>
      <div className="mt-6 max-w-3xl">
        <ArticleForm
          categories={categories ?? []}
          article={{
            title: "",
            slug: "",
            excerpt: "",
            content: "",
            categoryId: null,
            imagePath: null,
            imageAlt: "",
            imageWidth: null,
            imageHeight: null,
            authorName: last?.author_name || "Shepherd Justice Sarpong Oduro",
            seoTitle: "",
            metaDescription: "",
            status: "draft",
            publishedAt: null,
          }}
        />
      </div>
    </AdminShell>
  );
}

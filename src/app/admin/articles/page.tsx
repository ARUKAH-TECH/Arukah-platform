import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { addCategory, deleteCategory } from "@/features/admin/cms/articleActions";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Articles" };

export default async function AdminArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  const admin = await requireAdmin();
  const { show, deleted } = await searchParams;
  const filter = show === "draft" || show === "published" ? show : "all";
  const supabase = await createClient();
  let query = supabase
    .from("articles")
    .select("id, slug, title, status, published_at, updated_at, article_categories(name)")
    .order("updated_at", { ascending: false })
    .limit(300);
  if (filter !== "all") query = query.eq("status", filter);
  const [{ data: articles }, { data: categories }] = await Promise.all([
    query,
    supabase.from("article_categories").select("id, name").order("sort_order").order("name"),
  ]);

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Articles</h1>
        <Link href="/admin/articles/new" className={primaryButtonClasses}>
          + New article
        </Link>
      </div>
      {deleted === "1" && <p className="mt-4 text-sm text-green-700 dark:text-green-400">Article deleted.</p>}
      <nav className="mt-5 flex gap-2 text-sm">
        {(["all", "draft", "published"] as const).map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/articles" : `/admin/articles?show=${f}`}
            className={`rounded-full border px-3 py-1 ${filter === f ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}
          >
            {f === "all" ? "All" : f === "draft" ? "Drafts" : "Published"}
          </Link>
        ))}
      </nav>

      {!articles?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No articles here yet. Tap “+ New article” to write your first one.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {articles.map((a) => {
            const cat = (Array.isArray(a.article_categories) ? a.article_categories[0] : a.article_categories) as { name: string } | null;
            const live = a.status === "published";
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/admin/articles/${a.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        live ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                      }`}
                    >
                      {live ? "Published" : "Draft"}
                    </span>
                    <span className="truncate text-sm font-medium">{a.title}</span>
                  </span>
                  <span className="text-xs text-foreground/60">
                    {cat?.name ?? "No category"} ·{" "}
                    {live && a.published_at
                      ? `Published ${new Date(a.published_at).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Africa/Accra" })}`
                      : `Edited ${new Date(a.updated_at).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Africa/Accra" })}`}
                  </span>
                </Link>
                {live && (
                  <Link href={`/articles/${a.slug}`} target="_blank" className="text-xs text-brand-primary-text underline">
                    View ↗
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-12 max-w-xl rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Categories</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2">
              <span>{c.name}</span>
              <details className="text-xs">
                <summary className="cursor-pointer text-red-700 dark:text-red-400">Remove</summary>
                <form action={deleteCategory} className="mt-1">
                  <input type="hidden" name="id" value={c.id} />
                  <p className="text-foreground/60">Its articles stay, without a category.</p>
                  <button type="submit" className="mt-1 rounded-full bg-red-700 px-3 py-1 text-white">
                    Remove “{c.name}”
                  </button>
                </form>
              </details>
            </li>
          ))}
        </ul>
        <form action={addCategory} className="mt-4 flex gap-2">
          <input name="name" required maxLength={80} placeholder="New category name" className={`${fieldClasses} mt-0`} />
          <button type="submit" className={secondaryButtonClasses}>
            Add
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

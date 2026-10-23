import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { EDITABLE_PAGES } from "@/config/pages";

export const metadata: Metadata = { title: "Page text" };

export default async function AdminPagesPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: rows } = await supabase.from("page_content").select("page, content, updated_at");
  const edited = new Map(
    (rows ?? []).map((row) => [row.page as string, Object.keys((row.content as object) ?? {}).length]),
  );

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Page text</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Change the headings and wording on the website. Anything you leave unchanged keeps its original text.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EDITABLE_PAGES.map((page) => {
          const count = edited.get(page.id) ?? 0;
          return (
            <Link
              key={page.id}
              href={`/admin/pages/${page.id}`}
              className="rounded-2xl border border-black/10 bg-white p-6 hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900"
            >
              <h2 className="text-sm font-semibold">{page.label}</h2>
              <p className="mt-1 text-xs text-foreground/60">
                {count > 0 ? `${count} field${count === 1 ? "" : "s"} edited` : "Original wording"}
              </p>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}

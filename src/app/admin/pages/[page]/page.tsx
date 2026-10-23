import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { PageTextForm } from "@/features/admin/cms/PageTextForm";
import { findPage, mergePageText } from "@/config/pages";

export const metadata: Metadata = { title: "Edit page text" };

export default async function EditPageTextPage({ params }: PageProps<"/admin/pages/[page]">) {
  const admin = await requireAdmin();
  const { page: pageId } = await params;
  const page = findPage(pageId);
  if (!page) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("page_content").select("content, updated_at").eq("page", page.id).maybeSingle();
  const values = mergePageText(page, data?.content);

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/pages" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All pages
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{page.label}</h1>
        <Link href={page.path} target="_blank" className="text-sm text-brand-primary-text hover:underline">
          View page ↗
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/60">Clear a field and save to put back its original wording.</p>

      <div className="mt-8 max-w-3xl">
        <PageTextForm
          version={data?.updated_at ?? "original"}
          pageId={page.id}
          groups={page.groups}
          values={values}
        />
      </div>
    </AdminShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { BookForm } from "@/features/admin/cms/BookForm";
import { deleteBook } from "@/features/admin/cms/bookActions";

export const metadata: Metadata = { title: "Edit book" };

const asText = (value: number | string | null) => (value === null || value === undefined ? "" : String(value));

export default async function EditBookPage({ params, searchParams }: PageProps<"/admin/books/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: b } = await supabase
    .from("books")
    .select(
      "id, slug, title, author, description, sample_text, cover_path, cover_width, cover_height, book_file_path, book_file_name, book_file_size, price_read_ghs, price_download_ghs, price_print_ghs, status, sort_order",
    )
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/books" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All books
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{b.title}</h1>
        {b.status === "published" && (
          <Link href={`/books/${b.slug}`} target="_blank" className="text-sm text-brand-primary-text hover:underline">
            View on site ↗
          </Link>
        )}
      </div>
      <div className="mt-8 max-w-3xl">
        <BookForm
          justSaved={saved === "1"}
          book={{
            id: b.id,
            title: b.title,
            slug: b.slug,
            author: b.author,
            description: b.description,
            sampleText: b.sample_text,
            coverPath: b.cover_path,
            filePath: b.book_file_path,
            fileName: b.book_file_name ?? "",
            fileSize: b.book_file_size,
            coverWidth: b.cover_width,
            coverHeight: b.cover_height,
            priceRead: asText(b.price_read_ghs),
            priceDownload: asText(b.price_download_ghs),
            pricePrint: asText(b.price_print_ghs),
            status: b.status,
            sortOrder: b.sort_order,
          }}
        />
      </div>
      <section className="mt-12 max-w-3xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this book…</summary>
          <p className="mt-2 text-xs text-foreground/60">To hide it but keep it, set the status to Archived instead.</p>
          <form action={deleteBook} className="mt-3">
            <input type="hidden" name="id" value={b.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}

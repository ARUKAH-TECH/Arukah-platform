import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { primaryButtonClasses } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Books" };

const statusStyles: Record<string, string> = {
  draft: "bg-black/5 text-foreground/70 dark:bg-white/10",
  published: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  archived: "bg-black/5 text-foreground/50 dark:bg-white/10",
};

export default async function AdminBooksPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: books } = await supabase
    .from("books")
    .select("id, title, author, status, sort_order")
    .order("sort_order")
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <Link href="/admin/books/new" className={primaryButtonClasses}>
          New book
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/60">Published books appear on the ZIVARUKAH BOOKS page.</p>

      {!books?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No books yet.</p>
      ) : (
        <ul className="mt-8 flex flex-col divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-900">
          {books.map((book) => (
            <li key={book.id}>
              <Link href={`/admin/books/${book.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyles[book.status] ?? ""}`}>{book.status}</span>
                <span className="text-sm font-medium">{book.title}</span>
                {book.author && <span className="text-xs text-foreground/50">by {book.author}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { BookForm } from "@/features/admin/cms/BookForm";

export const metadata: Metadata = { title: "New book" };

export default async function NewBookPage() {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/books" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All books
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New book</h1>
      <div className="mt-8 max-w-3xl">
        <BookForm
          book={{
            title: "",
            slug: "",
            author: "",
            description: "",
            sampleText: "",
            coverPath: null,
            filePath: null,
            fileName: "",
            fileSize: null,
            coverWidth: null,
            coverHeight: null,
            priceRead: "",
            priceDownload: "",
            pricePrint: "",
            status: "draft",
            sortOrder: 0,
          }}
        />
      </div>
    </AdminShell>
  );
}

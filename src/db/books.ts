import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";
import { BOOK_FORMATS, type BookFormat } from "@/config/books";

export interface BookPrice {
  format: BookFormat;
  label: string;
  amount: number;
}

export interface PublicBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  sampleText: string;
  highlights: string[];
  cover: { url: string; width: number | null; height: number | null } | null;
  prices: BookPrice[];
}

interface BookRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  sample_text: string;
  highlights: string[] | null;
  cover_path: string | null;
  cover_width: number | null;
  cover_height: number | null;
  price_read_ghs: number | string | null;
  price_download_ghs: number | string | null;
  price_print_ghs: number | string | null;
}

const COLUMNS =
  "id, slug, title, author, description, sample_text, highlights, cover_path, cover_width, cover_height, price_read_ghs, price_download_ghs, price_print_ghs";

function toBook(row: BookRow): PublicBook {
  const prices: BookPrice[] = [];
  for (const format of BOOK_FORMATS) {
    const raw = row[format.column];
    if (raw !== null && raw !== undefined && raw !== "") prices.push({ format: format.id, label: format.label, amount: Number(raw) });
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    description: row.description,
    sampleText: row.sample_text,
    highlights: row.highlights ?? [],
    cover: row.cover_path ? { url: mediaPublicUrl(row.cover_path), width: row.cover_width, height: row.cover_height } : null,
    prices,
  };
}

function safeClient() {
  try {
    return createPublicClient();
  } catch {
    return null;
  }
}

/** Published books in the admin's chosen order. Any failure means "no books" (the page still renders). */
export async function getPublishedBooks(): Promise<PublicBook[]> {
  const client = safeClient();
  if (!client) return [];
  const { data, error } = await client
    .from("books")
    .select(COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[books] list failed", error.message);
    return [];
  }
  return (data as BookRow[]).map(toBook);
}

export async function getPublishedBook(slug: string): Promise<PublicBook | null> {
  const client = safeClient();
  if (!client) return null;
  const { data, error } = await client.from("books").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[books] detail failed", error.message);
    return null;
  }
  return data ? toBook(data as BookRow) : null;
}

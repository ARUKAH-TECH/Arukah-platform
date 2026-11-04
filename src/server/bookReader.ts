import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { quickPaymentsEnabled } from "@/server/quickPayments";

export interface ReaderBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  highlights: string[];
  pages: string[];
}

export type ReaderAccess =
  | { ok: true; mode: "admin" | "paid"; book: ReaderBook }
  | { ok: true; mode: "free"; book: ReaderBook; expiresAt: string }
  | { ok: false; reason: "no-book" | "not-paid" | "expired" | "no-text" };

const READ_DAYS = 365;
const FREE_DAYS = 7;
/** Free reading keys earned in ZIVA Literacy "Invite & earn". */
export const FREE_KEY = /^ZF-[A-Z0-9]{10}$/;

/** Signed-in admin (with two-factor) — they can preview any book's reader. */
async function isAdmin() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return null;
    const { data } = await supabase.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
    return data ? supabase : null;
  } catch {
    return null;
  }
}

/**
 * Who may read: an admin, or someone holding the reference of a verified
 * Paystack payment for this book in "Read online" or "Digital download".
 */
export async function loadReader(slug: string, reference: string): Promise<ReaderAccess> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return { ok: false, reason: "no-book" };

  const admin = await isAdmin();
  let supabase;
  let mode: "admin" | "paid" | "free";
  let expiresAt = "";
  if (admin) {
    supabase = admin;
    mode = "admin";
  } else if (FREE_KEY.test(reference)) {
    // A free 7-day key: the days start the first time it is opened.
    supabase = createServiceClient();
    mode = "free";
    const { data: key } = await supabase.from("lit_reward_keys").select("book_slug, activated_at").eq("key", reference).maybeSingle();
    if (!key || key.book_slug !== slug) return { ok: false, reason: "not-paid" };
    let started = key.activated_at as string | null;
    if (!started) {
      started = new Date().toISOString();
      await supabase.from("lit_reward_keys").update({ activated_at: started }).eq("key", reference).is("activated_at", null);
    }
    const ends = new Date(started).getTime() + FREE_DAYS * 24 * 3600 * 1000;
    if (Date.now() > ends) return { ok: false, reason: "expired" };
    expiresAt = new Date(ends).toISOString();
  } else {
    if (!/^ZS-[A-Z0-9]{10}$/.test(reference) || !quickPaymentsEnabled()) return { ok: false, reason: "not-paid" };
    supabase = createServiceClient();
    mode = "paid";
  }

  const { data: book } = await supabase.from("books").select("id, slug, title, author, highlights").eq("slug", slug).maybeSingle();
  if (!book) return { ok: false, reason: "no-book" };

  if (mode === "paid") {
    const { data: payment } = await supabase
      .from("quick_payments")
      .select("book_id, status, book_format, paid_at")
      .eq("reference", reference)
      .maybeSingle();
    if (!payment || payment.status !== "success" || payment.book_id !== book.id) return { ok: false, reason: "not-paid" };
    if (payment.book_format !== "read" && payment.book_format !== "download") return { ok: false, reason: "not-paid" };
    if (payment.paid_at && Date.now() - new Date(payment.paid_at).getTime() > READ_DAYS * 24 * 3600 * 1000) {
      return { ok: false, reason: "expired" };
    }
  }

  const { data: pages } = await supabase
    .from("book_pages")
    .select("page_no, content")
    .eq("book_id", book.id)
    .order("page_no", { ascending: true });
  if (!pages?.length) return { ok: false, reason: "no-text" };

  const readerBook: ReaderBook = {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author ?? "",
    highlights: book.highlights ?? [],
    pages: pages.map((p) => p.content as string),
  };
  if (mode === "free") return { ok: true, mode, book: readerBook, expiresAt };
  return {
    ok: true,
    mode,
    book: {
      id: book.id,
      slug: book.slug,
      title: book.title,
      author: book.author ?? "",
      highlights: book.highlights ?? [],
      pages: pages.map((p) => p.content as string),
    },
  };
}

// ── Free preview: chapter 1 and the first half of chapter 2 ──
// Everything before chapter 2 (title, dedication, preface, chapter 1) plus about
// half of chapter 2 is free to read. The rest is only sent after payment.

const CHAPTER = /(^|\n)[ \t]*chapter[ \t]+(\d+|one|two|three)\b/gi;
const NUM: Record<string, number> = { one: 1, two: 2, three: 3 };

function headings(page: string) {
  return [...page.matchAll(CHAPTER)].map((m) => ({
    n: NUM[m[2].toLowerCase()] ?? Number(m[2]),
    at: (m.index ?? 0) + m[1].length,
  }));
}

/** The free part of a book's pages (never the whole book). */
export function previewPages(pages: string[]): string[] {
  // Contents and question pages list many chapters at once: skip them.
  const marks = pages.map((p, i) => ({ i, list: headings(p) })).filter((x) => x.list.length > 0 && x.list.length < 3);
  const find = (n: number, from = 0) => {
    for (const m of marks) {
      if (m.i < from) continue;
      const h = m.list.find((x) => x.n === n);
      if (h) return { page: m.i, at: h.at };
    }
    return null;
  };
  const one = find(1);
  const two = one ? find(2, one.page) : null;
  if (!two) {
    // No chapters found: show the first quarter of the pages.
    return pages.slice(0, Math.max(1, Math.floor(pages.length / 4)));
  }
  const three = find(3, two.page);
  const endPage = three ? three.page : Math.min(pages.length - 1, two.page + 3);

  // Chapter 2's paragraphs, page by page.
  const parts: { page: number; paras: string[] }[] = [];
  for (let p = two.page; p <= endPage; p++) {
    let text = pages[p];
    if (p === two.page) text = text.slice(two.at);
    if (three && p === three.page) text = text.slice(0, p === two.page ? three.at - two.at : three.at);
    parts.push({ page: p, paras: text.split(/\n\s*\n/).filter((x) => x.trim()) });
  }
  const total = parts.reduce((s, x) => s + x.paras.reduce((a, b) => a + b.length, 0), 0);
  let budget = total / 2;

  const out = pages.slice(0, two.page);
  const before = pages[two.page].slice(0, two.at).trim();
  for (const part of parts) {
    if (budget <= 0) break;
    const keep: string[] = [];
    for (const para of part.paras) {
      if (budget <= 0) break;
      keep.push(para);
      budget -= para.length;
    }
    const text = keep.join("\n\n");
    if (part.page === two.page && before) out.push(`${before}\n\n${text}`);
    else if (text) out.push(text);
  }
  return out;
}

/** The free preview of a published book, for anyone. */
export async function loadPreview(slug: string): Promise<{ book: ReaderBook; totalPages: number } | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const supabase = createServiceClient();
  const { data: book } = await supabase.from("books").select("id, slug, title, author, highlights, status").eq("slug", slug).maybeSingle();
  if (!book || book.status !== "published") return null;
  const { data: pages } = await supabase.from("book_pages").select("page_no, content").eq("book_id", book.id).order("page_no", { ascending: true });
  if (!pages?.length) return null;
  const all = pages.map((p) => p.content as string);
  return {
    book: { id: book.id, slug: book.slug, title: book.title, author: book.author ?? "", highlights: book.highlights ?? [], pages: previewPages(all) },
    totalPages: all.length,
  };
}

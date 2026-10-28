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

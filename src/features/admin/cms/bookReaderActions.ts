"use server";

import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { isHeading } from "@/lib/bookText";

const UUID = /^[0-9a-f-]{36}$/;

/** Saves the reader text. Called in batches; the first batch replaces the old text. */
export async function saveBookPages(input: {
  bookId: string;
  firstPage: number;
  pages: string[];
  replace: boolean;
}): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!UUID.test(input.bookId)) return { ok: false, message: "Unknown book." };
  const supabase = await createClient();
  if (input.replace) {
    const { error } = await supabase.from("book_pages").delete().eq("book_id", input.bookId);
    if (error) return { ok: false, message: "Couldn't replace the old text." };
  }
  const rows = input.pages.slice(0, 200).map((content, i) => ({
    book_id: input.bookId,
    page_no: input.firstPage + i,
    content: String(content).slice(0, 60000),
  }));
  if (rows.length) {
    const { error } = await supabase.from("book_pages").upsert(rows);
    if (error) {
      console.error("[admin] saveBookPages failed", error.message);
      return { ok: false, message: "Couldn't save the text. Please try again." };
    }
  }
  return { ok: true, message: "Saved." };
}

export async function finishBookPages(bookId: string, slug: string, pageCount: number) {
  await requireAdmin();
  if (!UUID.test(bookId)) return;
  await audit("book.reader_text", { id: bookId, pages: pageCount });
  revalidatePath(`/admin/books/${bookId}`);
  if (/^[a-z0-9-]+$/.test(slug)) revalidatePath(`/books/${slug}`);
}

export async function saveHighlights(bookId: string, slug: string, text: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!UUID.test(bookId)) return { ok: false, message: "Unknown book." };
  const lines = text
    .split("\n")
    .map((line) => line.trim().replace(/^["“]|["”]$/g, ""))
    .filter((line) => line.length >= 8)
    .slice(0, 12)
    .map((line) => line.slice(0, 300));
  const supabase = await createClient();
  const { error } = await supabase.from("books").update({ highlights: lines }).eq("id", bookId);
  if (error) {
    console.error("[admin] saveHighlights failed", error.message);
    return { ok: false, message: "Couldn't save. Please try again." };
  }
  if (/^[a-z0-9-]+$/.test(slug)) revalidatePath(`/books/${slug}`);
  revalidatePath(`/admin/books/${bookId}`);
  return { ok: true, message: `Saved ${lines.length} line${lines.length === 1 ? "" : "s"}.` };
}

const WARM = /\b(forgiv\w*|heart|strength|strong|love|hope|free\w*|stone|stones|anger|grace|faith|god|dream\w*|courage|peace|brave|kind\w*|wisdom|shepherd|light|fire|grow|change|life|truth|believe)\b/gi;

/** Picks catchy lines from the book's own text (the admin can edit them). */
export async function suggestHighlights(bookId: string): Promise<string[]> {
  await requireAdmin();
  if (!UUID.test(bookId)) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("book_pages").select("page_no, content").eq("book_id", bookId).order("page_no");
  const candidates: { text: string; score: number; page: number }[] = [];
  let stop = false;
  for (const row of data ?? []) {
    for (const paragraph of String(row.content).split(/\n\n+/)) {
      if (isHeading(paragraph) && /^(questions|glossary|contents|table of contents)$/i.test(paragraph.trim())) stop = true;
      if (stop) break;
      // Sentences, with any speech marks removed.
      const sentences = paragraph.replace(/["“”]/g, "").match(/[^.!?]+[.!?]/g) ?? [];
      for (let sentence of sentences) {
        sentence = sentence.trim();
        if (sentence.length < 35 || sentence.length > 170 || /\d|chapter|©/i.test(sentence)) continue;
        if (/\b(said|asked|replied|whispered|hissed|snapped|grunted|complained|called)\b/i.test(sentence)) continue;
        let score = (sentence.match(WARM)?.length ?? 0) * 2;
        if (/\blike\b|\bas if\b/i.test(sentence)) score += 3; // a picture in words
        if (/\?$/.test(sentence)) score += 2;
        if (/\b(never|always|most|only|truly)\b/i.test(sentence)) score += 1;
        if (/^(it|that|this) is\b|\bis about\b|\bmeans\b/i.test(sentence)) score += 2; // a lesson
        if (sentence.length >= 50 && sentence.length <= 130) score += 1;
        if (score >= 3) candidates.push({ text: sentence, score, page: row.page_no });
      }
    }
    if (stop) break;
  }
  candidates.sort((a, b) => b.score - a.score);
  const picked: string[] = [];
  const perPage = new Map<number, number>();
  for (const c of candidates) {
    if ((perPage.get(c.page) ?? 0) >= 1) continue;
    if (picked.some((p) => p.toLowerCase() === c.text.toLowerCase())) continue;
    picked.push(c.text);
    perPage.set(c.page, (perPage.get(c.page) ?? 0) + 1);
    if (picked.length >= 6) break;
  }
  return picked;
}

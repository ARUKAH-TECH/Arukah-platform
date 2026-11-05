"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { slugify, type CmsFormState } from "@/features/admin/cms/shared";
import { parseReference } from "@/lib/bible";
import { parseQuiz } from "@/lib/bibleQuiz";
import { safeHref } from "@/lib/articleMarkup";

// Devotionals and Bible studies for zivarukah.com/bible. requireAdmin() checks
// on the server, and Row Level Security refuses writes from anyone else.

const UUID = /^[0-9a-f-]{36}$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function badRefs(refs: string) {
  return refs
    .split(/[;\n]/)
    .map((r) => r.trim())
    .filter(Boolean)
    .filter((r) => !parseReference(r));
}

function badLink(body: string) {
  for (const m of body.matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]*)\)/g)) if (!safeHref(m[1])) return m[1];
  if (/!\[[^\]]*\]\(/.test(body)) return "an image";
  return null;
}

function refresh() {
  revalidatePath("/bible", "layout");
  revalidatePath("/admin/bible", "layout");
}

export async function saveDevotional(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64);
  const day = text(formData, "day", 10);
  const title = text(formData, "title", 160);
  const verseRef = text(formData, "verseRef", 80);
  const body = text(formData, "body", 20000);
  const prayer = text(formData, "prayer", 3000);
  const status = text(formData, "status", 20) === "published" ? "published" : "draft";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { status: "error", message: "Choose the day for this devotional." };
  if (title.length < 2) return { status: "error", message: "Give the devotional a title." };
  if (status === "published" && body.length < 20) return { status: "error", message: "Write the devotional before publishing." };
  const bad = badRefs(verseRef);
  if (bad.length) return { status: "error", message: `This Bible reference wasn't understood: “${bad[0]}”. Write it like John 3:16 or Psalm 23:1-6.` };
  const link = badLink(body);
  if (link) return { status: "error", message: `This link can't be used: ${link.slice(0, 60)}. Links must start with https://.` };

  const supabase = await createClient();
  const row = { day, title, verse_ref: verseRef, body, prayer, status, updated_at: new Date().toISOString() };
  const result = id && UUID.test(id) ? await supabase.from("bible_devotionals").update(row).eq("id", id).select("id").single() : await supabase.from("bible_devotionals").insert(row).select("id").single();
  if (result.error) {
    if (result.error.code === "23505") return { status: "error", message: "There is already a devotional for that day. Choose another day or edit that one." };
    console.error("[admin] saveDevotional", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }
  await audit(id ? "devotional.update" : "devotional.create", { id: result.data.id, day, status });
  refresh();
  redirect(`/admin/bible/devotionals/${result.data.id}?saved=${status}`);
}

export async function deleteDevotional(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("bible_devotionals").delete().eq("id", id);
  await audit("devotional.delete", { id });
  refresh();
  redirect("/admin/bible?deleted=1");
}

export async function saveSeries(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64);
  const title = text(formData, "title", 160);
  const summary = text(formData, "summary", 600);
  const slug = (slugify(text(formData, "slug", 80)) || slugify(title)).slice(0, 80);
  const sortOrder = Math.max(0, Math.min(999, Math.round(Number(formData.get("sortOrder")) || 0)));
  const status = text(formData, "status", 20) === "published" ? "published" : "draft";
  if (title.length < 2) return { status: "error", message: "Give the study a title." };
  if (!slug) return { status: "error", message: "The web address is empty." };
  const supabase = await createClient();
  const row = { title, summary, slug, sort_order: sortOrder, status, updated_at: new Date().toISOString() };
  const result = id && UUID.test(id) ? await supabase.from("bible_series").update(row).eq("id", id).select("id").single() : await supabase.from("bible_series").insert(row).select("id").single();
  if (result.error) {
    if (result.error.code === "23505") return { status: "error", message: "Another study already uses that web address. Change it a little." };
    console.error("[admin] saveSeries", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }
  await audit(id ? "bible_series.update" : "bible_series.create", { id: result.data.id, slug, status });
  refresh();
  redirect(`/admin/bible/series/${result.data.id}?saved=${status}`);
}

export async function deleteSeries(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("bible_series").delete().eq("id", id);
  await audit("bible_series.delete", { id });
  refresh();
  redirect("/admin/bible?deleted=1");
}

export async function saveLesson(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64);
  const seriesId = text(formData, "seriesId", 64);
  const title = text(formData, "title", 160);
  const scripture = text(formData, "scripture", 300);
  const body = text(formData, "body", 40000);
  const quiz = text(formData, "quiz", 20000);
  const position = Math.max(1, Math.min(500, Math.round(Number(formData.get("position")) || 1)));
  const status = text(formData, "status", 20) === "published" ? "published" : "draft";
  if (!UUID.test(seriesId)) return { status: "error", message: "Open the study first, then add the lesson there." };
  if (title.length < 2) return { status: "error", message: "Give the lesson a title." };
  const bad = badRefs(scripture);
  if (bad.length) return { status: "error", message: `This Bible reference wasn't understood: “${bad[0]}”. Write them like John 3:16; Romans 10:9-10.` };
  const link = badLink(body);
  if (link) return { status: "error", message: `This link can't be used: ${link.slice(0, 60)}. Links must start with https://.` };
  const { problems } = parseQuiz(quiz);
  if (problems.length) return { status: "error", message: `Quiz: ${problems[0]}` };

  const supabase = await createClient();
  const row = { series_id: seriesId, title, scripture, body, quiz, position, status, updated_at: new Date().toISOString() };
  const result = id && UUID.test(id) ? await supabase.from("bible_lessons").update(row).eq("id", id).select("id").single() : await supabase.from("bible_lessons").insert(row).select("id").single();
  if (result.error) {
    console.error("[admin] saveLesson", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }
  await audit(id ? "bible_lesson.update" : "bible_lesson.create", { id: result.data.id, seriesId, status });
  refresh();
  redirect(`/admin/bible/lessons/${result.data.id}?saved=${status}`);
}

export async function deleteLesson(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  const seriesId = text(formData, "seriesId", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("bible_lessons").delete().eq("id", id);
  await audit("bible_lesson.delete", { id });
  refresh();
  redirect(UUID.test(seriesId) ? `/admin/bible/series/${seriesId}?deleted=1` : "/admin/bible");
}

// ── Themes, the automatic devotional, and "write one now" ──

export async function saveBibleSettings(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const periods = formData.getAll("period").map(String);
  for (const period of periods) {
    if (!/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(period)) continue;
    const theme = text(formData, `theme:${period}`, 200);
    const scripture = text(formData, `scripture:${period}`, 120);
    if (scripture && badRefs(scripture).length) return { status: "error", message: `This Bible reference wasn't understood: “${scripture}”. Write it like Isaiah 43:19.` };
    if (theme) {
      const { error } = await supabase.from("bible_themes").upsert({ period, theme, scripture, updated_at: new Date().toISOString() });
      if (error) return { status: "error", message: "Couldn't save the themes. Please try again." };
    } else {
      await supabase.from("bible_themes").delete().eq("period", period);
    }
  }
  const mode = text(formData, "autoMode", 10);
  if (["publish", "draft", "off"].includes(mode)) {
    await supabase.from("bible_settings").upsert({ key: "auto_devotional", value: mode, updated_at: new Date().toISOString() });
  }
  await audit("bible.settings", { periods, mode });
  revalidatePath("/admin/bible");
  return { status: "saved", message: "Saved ✓" };
}

export async function writeDevotionalNow(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const day = text(formData, "day", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { status: "error", message: "Choose a day." };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("bible_devotionals").select("id").eq("day", day).maybeSingle();
  if (existing) return { status: "error", message: "There is already a devotional for that day. Open it from the list to edit it." };
  const { themesFor, writeDevotional } = await import("@/server/bibleAuto");
  const { data: recent } = await supabase.from("bible_devotionals").select("title").order("day", { ascending: false }).limit(14);
  const draft = await writeDevotional(day, await themesFor(day), (recent ?? []).map((r) => r.title as string));
  if (!draft) return { status: "error", message: "The devotional couldn't be written just now. Please try again in a minute." };
  const { data, error } = await supabase
    .from("bible_devotionals")
    .insert({ day, title: draft.title, verse_ref: draft.verseRef, body: draft.body, prayer: draft.prayer, status: "draft", auto: true })
    .select("id")
    .single();
  if (error) return { status: "error", message: "Couldn't save the draft. Please try again." };
  await audit("devotional.ai_draft", { id: data.id, day });
  refresh();
  redirect(`/admin/bible/devotionals/${data.id}?saved=draft`);
}

export async function sendTestNotificationNow(_prev: CmsFormState): Promise<CmsFormState> {
  await requireAdmin();
  const { sendTestNotification } = await import("@/server/push");
  const result = await sendTestNotification();
  if (!result) return { status: "error", message: "Notifications aren't ready yet. Please try again in a minute." };
  await audit("bible.push_test", result);
  if (result.sent === 0 && result.failed === 0) return { status: "error", message: "No phone has turned on the daily devotional yet. Turn it on from zivarukah.com/bible first." };
  return { status: "saved", message: `Sent to ${result.sent} phone${result.sent === 1 ? "" : "s"}${result.failed ? ` (${result.failed} didn't receive it)` : ""}. Check your phone.` };
}

// ---- The founder's quotes and photos ----------------------------------------

function refreshQuotes() {
  revalidatePath("/admin/bible/quotes");
  revalidatePath("/", "layout");
}

export async function addFounderQuote(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const quote = text(formData, "text", 320).replace(/^["“”']+|["“”']+$/g, "").trim();
  if (quote.length < 5) return { status: "error", message: "Write the quote (at least a few words)." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("founder_quotes").insert({ text: quote, status: "published" }).select("id").single();
  if (error) return { status: "error", message: "Couldn't save the quote. Please try again." };
  await audit("founder_quote.add", { id: data.id });
  refreshQuotes();
  return { status: "saved", message: "Saved ✓ It now takes turns as the quote of the day." };
}

export async function setFounderQuoteStatus(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 36);
  const status = text(formData, "status", 10) === "draft" ? "draft" : "published";
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("founder_quotes").update({ status }).eq("id", id);
  await audit("founder_quote.status", { id, status });
  refreshQuotes();
}

export async function deleteFounderQuote(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 36);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("founder_quotes").delete().eq("id", id);
  await audit("founder_quote.delete", { id });
  refreshQuotes();
}

export async function registerFounderPhoto(input: { storagePath: string }): Promise<CmsFormState> {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(input.storagePath)) return { status: "error", message: "Unexpected file name." };
  const supabase = await createClient();
  const { error } = await supabase.from("founder_photos").insert({ storage_path: input.storagePath });
  if (error) return { status: "error", message: "The photo uploaded but couldn't be saved. Please try again." };
  await audit("founder_photo.add", { storagePath: input.storagePath });
  refreshQuotes();
  return { status: "saved", message: "Photo added ✓" };
}

export async function setFounderPhotoHidden(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 36);
  if (!UUID.test(id)) return;
  const hidden = text(formData, "hidden", 5) === "true";
  const supabase = await createClient();
  await supabase.from("founder_photos").update({ hidden }).eq("id", id);
  await audit("founder_photo.hidden", { id, hidden });
  refreshQuotes();
}

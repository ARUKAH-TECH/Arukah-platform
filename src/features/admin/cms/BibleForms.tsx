"use client";

import { useActionState } from "react";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { saveDevotional, saveLesson, saveSeries } from "@/features/admin/cms/bibleActions";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

function Status({ value }: { value: string }) {
  return (
    <label className="text-sm">
      Status
      <select name="status" defaultValue={value} className={fieldClasses}>
        <option value="draft">Draft (hidden)</option>
        <option value="published">Published</option>
      </select>
    </label>
  );
}

function Result({ state, saved }: { state: { status: string; message: string }; saved?: string }) {
  const shown = state.status !== "idle" ? state : saved ? { status: "saved", message: saved === "published" ? "Published ✓" : "Saved as a draft ✓" } : null;
  if (!shown) return null;
  return (
    <p role={shown.status === "error" ? "alert" : "status"} className={shown.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}>
      {shown.message}
    </p>
  );
}

const WRITING_HELP = "## Heading · **bold** · *italic* · - bullet · 1. numbered · > quote · [link text](https://…)";

export function DevotionalForm({ values, saved }: { values: { id?: string; day: string; title: string; verseRef: string; body: string; prayer: string; status: string }; saved?: string }) {
  const [state, action, pending] = useActionState(saveDevotional, initialCmsFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <label className="text-sm">
        Day *
        <input name="day" type="date" required defaultValue={values.day} className={`${fieldClasses} max-w-[12rem]`} />
        <span className="mt-1 block text-xs text-foreground/60">It appears on the website on this day (you can write ahead).</span>
      </label>
      <label className="text-sm">
        Title *
        <input name="title" required maxLength={160} defaultValue={values.title} placeholder="e.g. Strength for Today" className={fieldClasses} />
      </label>
      <label className="text-sm">
        Bible verse(s) <span className="text-foreground/60">(e.g. Isaiah 40:31 or John 3:16; Romans 5:8)</span>
        <input name="verseRef" maxLength={80} defaultValue={values.verseRef} className={fieldClasses} />
        <span className="mt-1 block text-xs text-foreground/60">The KJV text of these verses is shown above the devotional automatically.</span>
      </label>
      <label className="text-sm">
        Devotional *
        <textarea name="body" rows={12} maxLength={20000} defaultValue={values.body} className={fieldClasses} />
        <span className="mt-1 block text-xs text-foreground/60">{WRITING_HELP}</span>
      </label>
      <label className="text-sm">
        Prayer <span className="text-foreground/60">(optional)</span>
        <textarea name="prayer" rows={4} maxLength={3000} defaultValue={values.prayer} className={fieldClasses} />
      </label>
      <Status value={values.status} />
      <Result state={state} saved={saved} />
      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save devotional"}
        </button>
      </div>
    </form>
  );
}

export function SeriesForm({ values, saved }: { values: { id?: string; title: string; slug: string; summary: string; sortOrder: number; status: string }; saved?: string }) {
  const [state, action, pending] = useActionState(saveSeries, initialCmsFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <label className="text-sm">
        Title *
        <input name="title" required maxLength={160} defaultValue={values.title} placeholder="e.g. Foundations for New Believers" className={fieldClasses} />
      </label>
      <label className="text-sm">
        Short description
        <textarea name="summary" rows={3} maxLength={600} defaultValue={values.summary} className={fieldClasses} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Web address <span className="text-foreground/60">(empty = from the title)</span>
          <input name="slug" maxLength={80} defaultValue={values.slug} className={fieldClasses} />
        </label>
        <label className="text-sm">
          Order <span className="text-foreground/60">(smaller first)</span>
          <input name="sortOrder" type="number" min={0} max={999} defaultValue={values.sortOrder} className={`${fieldClasses} max-w-[8rem]`} />
        </label>
      </div>
      <Status value={values.status} />
      <Result state={state} saved={saved} />
      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save study"}
        </button>
      </div>
    </form>
  );
}

export function LessonForm({
  values,
  saved,
}: {
  values: { id?: string; seriesId: string; position: number; title: string; scripture: string; body: string; quiz: string; status: string };
  saved?: string;
}) {
  const [state, action, pending] = useActionState(saveLesson, initialCmsFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="seriesId" value={values.seriesId} />
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <label className="text-sm">
          Lesson no.
          <input name="position" type="number" min={1} max={500} defaultValue={values.position} className={fieldClasses} />
        </label>
        <label className="text-sm">
          Title *
          <input name="title" required maxLength={160} defaultValue={values.title} className={fieldClasses} />
        </label>
      </div>
      <label className="text-sm">
        Scripture <span className="text-foreground/60">(e.g. John 3:16; Romans 10:9-10)</span>
        <input name="scripture" maxLength={300} defaultValue={values.scripture} className={fieldClasses} />
        <span className="mt-1 block text-xs text-foreground/60">The KJV text is shown in the lesson automatically.</span>
      </label>
      <label className="text-sm">
        Lesson
        <textarea name="body" rows={14} maxLength={40000} defaultValue={values.body} className={fieldClasses} />
        <span className="mt-1 block text-xs text-foreground/60">{WRITING_HELP}</span>
      </label>
      <label className="text-sm">
        Quiz <span className="text-foreground/60">(optional)</span>
        <textarea name="quiz" rows={10} maxLength={20000} defaultValue={values.quiz} placeholder={"Q: Who led Israel after Moses?\n- Aaron\n* Joshua\n- Caleb\nWhy: Joshua 1:1-2\n\nQ: Next question…"} className={`${fieldClasses} font-mono text-sm`} />
        <span className="mt-1 block text-xs leading-5 text-foreground/60">
          Start each question with <strong>Q:</strong>, then each answer on its own line starting with <strong>-</strong>. Put <strong>*</strong> instead of - before the
          right answer. <strong>Why:</strong> (optional) explains it. Leave an empty line between questions.
        </span>
      </label>
      <Status value={values.status} />
      <Result state={state} saved={saved} />
      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save lesson"}
        </button>
      </div>
    </form>
  );
}

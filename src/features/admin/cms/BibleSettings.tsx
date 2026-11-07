"use client";

import { useActionState } from "react";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { saveBibleSettings, sendTestNotificationNow, writeDevotionalNow } from "@/features/admin/cms/bibleActions";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export interface ThemeRow {
  period: string;
  label: string;
  theme: string;
  scripture: string;
}

export function BibleSettingsForm({ themes, mode }: { themes: ThemeRow[]; mode: string }) {
  const [state, action, pending] = useActionState(saveBibleSettings, initialCmsFormState);
  return (
    <form action={action} className="flex flex-col gap-4">
      {themes.map((t) => (
        <fieldset key={t.period} className="flex flex-col gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-semibold">{t.label}</legend>
          <input type="hidden" name="period" value={t.period} />
          <label className="text-sm">
            Theme
            <input name={`theme:${t.period}`} maxLength={200} defaultValue={t.theme} placeholder="e.g. Year of Total Restoration" className={fieldClasses} />
          </label>
          <label className="text-sm">
            Scripture <span className="text-foreground/60">(optional, e.g. Joel 2:25)</span>
            <input name={`scripture:${t.period}`} maxLength={120} defaultValue={t.scripture} className={fieldClasses} />
          </label>
        </fieldset>
      ))}
      <label className="text-sm">
        At 5:30am, if you haven't published a devotional for the day by 5:00am
        <select name="autoMode" defaultValue={mode} className={fieldClasses}>
          <option value="publish">Write one on these themes and publish it</option>
          <option value="draft">Write one as a draft for me to check</option>
          <option value="off">Do nothing</option>
        </select>
      </label>
      {state.status !== "idle" && (
        <p role="status" className={state.status === "error" ? "text-sm text-red-700" : "text-sm text-green-700"}>
          {state.message}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save themes"}
        </button>
      </div>
    </form>
  );
}

export function WriteNowForm({ day }: { day: string }) {
  const [state, action, pending] = useActionState(writeDevotionalNow, initialCmsFormState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        Day
        <input name="day" type="date" required defaultValue={day} className={`${fieldClasses} max-w-[12rem]`} />
      </label>
      <button type="submit" disabled={pending} className={secondaryButtonClasses}>
        {pending ? "✨ Writing… (up to a minute)" : "✨ Write a draft on the themes"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="w-full text-sm text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function TestNotificationForm({ phones }: { phones: number }) {
  const [state, action, pending] = useActionState(sendTestNotificationNow, initialCmsFormState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={pending} className={secondaryButtonClasses}>
        {pending ? "🔔 Sending…" : `🔔 Send a test now to ${phones} phone${phones === 1 ? "" : "s"}`}
      </button>
      {state.status !== "idle" && state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={`w-full text-sm ${state.status === "error" ? "text-red-700" : "text-green-700 dark:text-green-400"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { saveAnnouncement } from "@/features/admin/cms/announcementActions";
import {
  ANNOUNCEMENT_TONES,
  PROJECT_STATUSES,
  STATUS_LABELS,
  TONE_LABELS,
  initialCmsFormState,
  toInputDateTime,
  type AnnouncementToneValue,
} from "@/features/admin/cms/shared";
import { BRANCHES } from "@/config/branches";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export interface AnnouncementFormValues {
  id?: string;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string;
  tone: AnnouncementToneValue;
  status: string;
  publishAt: string | null;
  unpublishAt: string | null;
  branches: string[];
}

// Mirrors the public AnnouncementBar so the admin sees what visitors will see.
const previewTone: Record<AnnouncementToneValue, string> = {
  info: "bg-zinc-900 text-white",
  highlight: "bg-brand-primary text-brand-on-primary",
  urgent: "bg-red-700 text-white",
};

export function AnnouncementForm({
  announcement,
  justSaved,
}: {
  announcement: AnnouncementFormValues;
  justSaved?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveAnnouncement, initialCmsFormState);
  const [title, setTitle] = useState(announcement.title);
  const [message, setMessage] = useState(announcement.message);
  const [linkUrl, setLinkUrl] = useState(announcement.linkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(announcement.linkLabel);
  const [tone, setTone] = useState<AnnouncementToneValue>(announcement.tone);
  const [status, setStatus] = useState(announcement.status);

  const shownMessage =
    state.status !== "idle" ? state : justSaved ? { status: "saved", message: "Saved." } : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {announcement.id && <input type="hidden" name="id" value={announcement.id} />}

      <div>
        <p className="text-sm font-medium">Preview</p>
        <div className={`${previewTone[tone]} mt-1 rounded-lg px-4 py-3 text-center text-sm`}>
          <span className="font-semibold">{title || "Headline"}</span>
          {message && <span className="ml-3 opacity-90">{message}</span>}
          {linkUrl && <span className="ml-3 font-semibold underline">{linkLabel || "Learn more"} →</span>}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Headline <span className="font-normal text-foreground/50">(max 120 characters)</span>
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClasses}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message <span className="font-normal text-foreground/50">(optional, max 500 characters)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={2}
          maxLength={500}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={fieldClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="linkUrl" className="block text-sm font-medium">
            Link <span className="font-normal text-foreground/50">(optional)</span>
          </label>
          <input
            id="linkUrl"
            name="linkUrl"
            maxLength={500}
            placeholder="/contact or https://…"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="linkLabel" className="block text-sm font-medium">
            Link text <span className="font-normal text-foreground/50">(e.g. “Register now”)</span>
          </label>
          <input
            id="linkLabel"
            name="linkLabel"
            maxLength={40}
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            className={fieldClasses}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tone" className="block text-sm font-medium">
          Style
        </label>
        <select
          id="tone"
          name="tone"
          value={tone}
          onChange={(event) => setTone(event.target.value as AnnouncementToneValue)}
          className={fieldClasses}
        >
          {ANNOUNCEMENT_TONES.map((value) => (
            <option key={value} value={value}>
              {TONE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Show at the top of</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BRANCHES.map((branch) => (
            <label key={branch.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="branches"
                value={branch.id}
                defaultChecked={announcement.branches.includes(branch.id)}
              />
              {branch.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={fieldClasses}
          >
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="publishAt" className="block text-sm font-medium">
            Start <span className="font-normal text-foreground/50">(Ghana time)</span>
          </label>
          <input
            id="publishAt"
            name="publishAt"
            type="datetime-local"
            defaultValue={toInputDateTime(announcement.publishAt)}
            required={status === "scheduled"}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="unpublishAt" className="block text-sm font-medium">
            End <span className="font-normal text-foreground/50">(optional)</span>
          </label>
          <input
            id="unpublishAt"
            name="unpublishAt"
            type="datetime-local"
            defaultValue={toInputDateTime(announcement.unpublishAt)}
            className={fieldClasses}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-foreground/50">
        Scheduled announcements appear by themselves within about a minute of the start time, and disappear at the end
        time.
      </p>

      {shownMessage && (
        <p
          role={shownMessage.status === "error" ? "alert" : "status"}
          className={
            shownMessage.status === "error"
              ? "text-sm text-red-700 dark:text-red-400"
              : "text-sm text-green-700 dark:text-green-400"
          }
        >
          {shownMessage.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save announcement"}
        </button>
      </div>
    </form>
  );
}

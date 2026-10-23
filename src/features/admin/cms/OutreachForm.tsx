"use client";

import { useActionState, useState } from "react";
import { saveOutreach } from "@/features/admin/cms/outreachActions";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  initialCmsFormState,
  slugify,
  toInputDateTime,
} from "@/features/admin/cms/shared";
import { OUTREACH_TYPES, needsFacilityPermission } from "@/config/outreach";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export interface OutreachFormValues {
  id?: string;
  title: string;
  slug: string;
  type: string;
  purpose: string;
  body: string;
  date: string | null;
  location: string;
  needs: string[];
  facilityPermission: boolean;
  facilityPermissionNote: string;
  status: string;
  publishAt: string | null;
  unpublishAt: string | null;
}

export function OutreachForm({ outreach, justSaved }: { outreach: OutreachFormValues; justSaved?: boolean }) {
  const [state, formAction, pending] = useActionState(saveOutreach, initialCmsFormState);
  const [title, setTitle] = useState(outreach.title);
  const [slug, setSlug] = useState(outreach.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(outreach.id));
  const [type, setType] = useState(outreach.type);
  const [permission, setPermission] = useState(outreach.facilityPermission);
  const [status, setStatus] = useState(outreach.status);

  const facilityRequired = needsFacilityPermission(type);
  const goingLive = status === "published" || status === "scheduled";
  const blocked = facilityRequired && goingLive && !permission;
  const shownMessage = state.status !== "idle" ? state : justSaved ? { status: "saved", message: "Saved." } : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {outreach.id && <input type="hidden" name="id" value={outreach.id} />}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={150}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          className={fieldClasses}
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium">
          Web address
        </label>
        <div className="mt-1 flex items-center gap-1 text-sm">
          <span className="shrink-0 text-foreground/50">/ministry/outreach/</span>
          <input
            id="slug"
            name="slug"
            maxLength={80}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className={`${fieldClasses} mt-0`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select id="type" name="type" value={type} onChange={(event) => setType(event.target.value)} className={fieldClasses}>
            {OUTREACH_TYPES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date of the outreach
          </label>
          <input id="date" name="date" type="date" defaultValue={outreach.date ?? ""} className={fieldClasses} />
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium">
            Location
          </label>
          <input id="location" name="location" maxLength={200} defaultValue={outreach.location} className={fieldClasses} />
        </div>
      </div>

      <div>
        <label htmlFor="purpose" className="block text-sm font-medium">
          Purpose <span className="font-normal text-foreground/50">(shown on cards, max 600 characters)</span>
        </label>
        <textarea id="purpose" name="purpose" rows={2} maxLength={600} defaultValue={outreach.purpose} className={fieldClasses} />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Full report <span className="font-normal text-foreground/50">(leave a blank line between paragraphs)</span>
        </label>
        <textarea id="body" name="body" rows={8} maxLength={20000} defaultValue={outreach.body} className={fieldClasses} />
      </div>

      <div>
        <label htmlFor="needs" className="block text-sm font-medium">
          Needs <span className="font-normal text-foreground/50">(one per line, e.g. “Bags of rice”, “Toiletries”)</span>
        </label>
        <textarea id="needs" name="needs" rows={4} defaultValue={outreach.needs.join("\n")} className={fieldClasses} />
      </div>

      {facilityRequired && (
        <fieldset className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <legend className="px-1 text-sm font-semibold">Facility permission</legend>
          <p className="text-xs leading-5">
            Hospitals and prisons have their own rules about visits and publicity. This outreach can only be published
            once the facility has agreed.
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="facilityPermission"
              checked={permission}
              onChange={(event) => setPermission(event.target.checked)}
              className="mt-1"
            />
            The facility gave permission for this outreach to be published.
          </label>
          <label htmlFor="facilityPermissionNote" className="mt-3 block text-xs font-medium">
            Who gave permission, and when? <span className="font-normal opacity-70">(kept private, never shown on the site)</span>
          </label>
          <input
            id="facilityPermissionNote"
            name="facilityPermissionNote"
            maxLength={300}
            defaultValue={outreach.facilityPermissionNote}
            placeholder="e.g. Officer in charge, by letter on 20 Oct"
            className={fieldClasses}
          />
        </fieldset>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select id="status" name="status" value={status} onChange={(event) => setStatus(event.target.value)} className={fieldClasses}>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="publishAt" className="block text-sm font-medium">
            Publish at <span className="font-normal text-foreground/50">(Ghana time)</span>
          </label>
          <input
            id="publishAt"
            name="publishAt"
            type="datetime-local"
            defaultValue={toInputDateTime(outreach.publishAt)}
            required={status === "scheduled"}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="unpublishAt" className="block text-sm font-medium">
            Unpublish at <span className="font-normal text-foreground/50">(optional)</span>
          </label>
          <input
            id="unpublishAt"
            name="unpublishAt"
            type="datetime-local"
            defaultValue={toInputDateTime(outreach.unpublishAt)}
            className={fieldClasses}
          />
        </div>
      </div>

      {blocked && (
        <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">
          Tick the facility permission box above before publishing, or save as a draft.
        </p>
      )}

      {shownMessage && (
        <p
          role={shownMessage.status === "error" ? "alert" : "status"}
          className={shownMessage.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
        >
          {shownMessage.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending || blocked} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save outreach"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { saveProject } from "@/features/admin/cms/actions";
import {
  PROJECT_STATUSES,
  STATUS_LABELS,
  initialCmsFormState,
  slugify,
  toInputDateTime,
} from "@/features/admin/cms/shared";
import { BRANCHES } from "@/config/branches";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export interface ProjectFormValues {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: string;
  publishAt: string | null;
  unpublishAt: string | null;
  branches: string[];
  coverMediaId: string | null;
}

interface ProjectFormProps {
  project: ProjectFormValues;
  /** Images attached to this project, for choosing the cover. */
  images: { id: string; label: string }[];
  justSaved?: boolean;
}

export function ProjectForm({ project, images, justSaved }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(saveProject, initialCmsFormState);
  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(project.id));
  const [status, setStatus] = useState(project.status);

  const shownMessage =
    state.status !== "idle" ? state : justSaved ? { status: "saved", message: "Saved." } : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {project.id && <input type="hidden" name="id" value={project.id} />}

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
          <span className="text-foreground/60">zivarukah.com/projects/</span>
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

      <div>
        <label htmlFor="summary" className="block text-sm font-medium">
          Short summary <span className="font-normal text-foreground/60">(shown on cards, max 300 characters)</span>
        </label>
        <textarea id="summary" name="summary" rows={2} maxLength={300} defaultValue={project.summary} className={fieldClasses} />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium">
          Full description <span className="font-normal text-foreground/60">(leave a blank line between paragraphs)</span>
        </label>
        <textarea id="body" name="body" rows={10} maxLength={20000} defaultValue={project.body} className={fieldClasses} />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Show on</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BRANCHES.map((branch) => (
            <label key={branch.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="branches"
                value={branch.id}
                defaultChecked={project.branches.includes(branch.id)}
              />
              {branch.label}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-foreground/60">Every published project also appears on the Projects page.</p>
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
            Publish at <span className="font-normal text-foreground/60">(Ghana time)</span>
          </label>
          <input
            id="publishAt"
            name="publishAt"
            type="datetime-local"
            defaultValue={toInputDateTime(project.publishAt)}
            required={status === "scheduled"}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="unpublishAt" className="block text-sm font-medium">
            Unpublish at <span className="font-normal text-foreground/60">(optional)</span>
          </label>
          <input
            id="unpublishAt"
            name="unpublishAt"
            type="datetime-local"
            defaultValue={toInputDateTime(project.unpublishAt)}
            className={fieldClasses}
          />
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <label htmlFor="coverMediaId" className="block text-sm font-medium">
            Cover image
          </label>
          <select id="coverMediaId" name="coverMediaId" defaultValue={project.coverMediaId ?? ""} className={fieldClasses}>
            <option value="">First attached image</option>
            {images.map((image) => (
              <option key={image.id} value={image.id}>
                {image.label}
              </option>
            ))}
          </select>
        </div>
      )}

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
          {pending ? "Saving…" : "Save project"}
        </button>
      </div>
    </form>
  );
}

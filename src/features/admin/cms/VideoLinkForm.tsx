"use client";

import { useActionState } from "react";
import { addVideoLink } from "@/features/admin/cms/actions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

interface VideoLinkFormProps {
  projects: { id: string; title: string }[];
  defaultProjectId?: string;
}

export function VideoLinkForm({ projects, defaultProjectId }: VideoLinkFormProps) {
  const [state, formAction, pending] = useActionState(addVideoLink, initialCmsFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium">
          YouTube or TikTok link
        </label>
        <input id="videoUrl" name="videoUrl" type="url" required placeholder="https://www.youtube.com/watch?v=…" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="videoCaption" className="block text-sm font-medium">
          Caption <span className="font-normal text-foreground/60">(optional)</span>
        </label>
        <input id="videoCaption" name="caption" maxLength={500} className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="videoProject" className="block text-sm font-medium">
          Attach to project
        </label>
        <select id="videoProject" name="projectId" defaultValue={defaultProjectId ?? ""} className={fieldClasses}>
          <option value="">None (keep in library)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </div>
      {state.status !== "idle" && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
        >
          {state.message}
        </p>
      )}
      <div>
        <button type="submit" disabled={pending} className={primaryButtonClasses}>
          {pending ? "Adding…" : "Add video link"}
        </button>
      </div>
    </form>
  );
}

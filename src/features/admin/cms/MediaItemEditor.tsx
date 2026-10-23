"use client";

import { useActionState } from "react";
import { deleteMedia, updateMedia } from "@/features/admin/cms/actions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, secondaryButtonClasses } from "@/features/admin/ui";

interface MediaItemEditorProps {
  item: { id: string; kind: string; altText: string; caption: string; projectId: string | null };
  projects: { id: string; title: string }[];
}

export function MediaItemEditor({ item, projects }: MediaItemEditorProps) {
  const [state, formAction, pending] = useActionState(updateMedia, initialCmsFormState);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={item.id} />
        {item.kind === "image" && (
          <label className="text-xs font-medium">
            Description
            <input name="altText" defaultValue={item.altText} maxLength={300} className={fieldClasses} />
          </label>
        )}
        <label className="text-xs font-medium">
          Caption
          <input name="caption" defaultValue={item.caption} maxLength={500} className={fieldClasses} />
        </label>
        <label className="text-xs font-medium">
          Project
          <select name="projectId" defaultValue={item.projectId ?? ""} className={fieldClasses}>
            <option value="">None</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={secondaryButtonClasses}>
            {pending ? "Saving…" : "Save"}
          </button>
          {state.status !== "idle" && (
            <span className={state.status === "error" ? "text-xs text-red-700 dark:text-red-400" : "text-xs text-green-700 dark:text-green-400"}>
              {state.message}
            </span>
          )}
        </div>
      </form>

      {/* Two steps so a stray click can't remove anything. */}
      <details className="text-xs">
        <summary className="cursor-pointer text-red-700 dark:text-red-400">Remove…</summary>
        <form action={deleteMedia} className="mt-2 flex items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <span className="text-foreground/60">This permanently deletes the file.</span>
          <button type="submit" className="rounded-full bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800">
            Delete for good
          </button>
        </form>
      </details>
    </div>
  );
}

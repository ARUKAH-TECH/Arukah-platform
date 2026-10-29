"use client";

import { useActionState } from "react";
import { updateInboxMessage } from "@/features/admin/cms/inboxActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export function InboxStatusForm({ id, status, adminNote }: { id: string; status: string; adminNote: string }) {
  const [state, formAction, pending] = useActionState(updateInboxMessage, initialCmsFormState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="text-sm font-medium">Status</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {[
            { value: "new", label: "New" },
            { value: "in_progress", label: "In progress" },
            { value: "handled", label: "Handled" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input type="radio" name="status" value={option.value} defaultChecked={status === option.value} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="adminNote" className="block text-sm font-medium">
          Private note <span className="font-normal text-foreground/60">(e.g. who followed up, when)</span>
        </label>
        <textarea id="adminNote" name="adminNote" rows={3} maxLength={2000} defaultValue={adminNote} className={fieldClasses} />
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
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { saveAdSettings } from "@/features/admin/cms/adActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { AD_BRANCHES } from "@/features/admin/cms/adStatus";
import { secondaryButtonClasses } from "@/features/admin/ui";

export function AdSettingsForm({ accepting }: { accepting: string[] }) {
  const [state, formAction, pending] = useActionState(saveAdSettings, initialCmsFormState);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {AD_BRANCHES.map((branch) => (
          <label key={branch.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accepts" value={branch.id} defaultChecked={accepting.includes(branch.id)} />
            {branch.label}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
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
  );
}

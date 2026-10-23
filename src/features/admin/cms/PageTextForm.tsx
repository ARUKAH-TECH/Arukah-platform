"use client";

import { useActionState } from "react";
import { resetPageText, savePageText } from "@/features/admin/cms/pageTextActions";
import { initialCmsFormState, type CmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";
import type { FieldDef, FieldGroup, PageText } from "@/config/pages";

function Message({ state }: { state: CmsFormState }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={state.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
    >
      {state.message}
    </p>
  );
}

function Field({ field, value }: { field: FieldDef; value: string | string[] }) {
  const isList = field.kind === "list";
  const current = Array.isArray(value) ? value.join("\n") : value;
  const original = Array.isArray(field.default) ? field.default.join("\n") : field.default;
  const changed = current !== original;

  return (
    <div>
      <label htmlFor={field.key} className="flex flex-wrap items-baseline gap-2 text-sm font-medium">
        {field.label}
        {changed && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
            edited
          </span>
        )}
      </label>
      {field.kind === "text" ? (
        <input id={field.key} name={field.key} defaultValue={current} maxLength={field.max} className={fieldClasses} />
      ) : (
        <textarea
          id={field.key}
          name={field.key}
          defaultValue={current}
          rows={isList ? Math.max(3, (field.maxItems ?? 6) - 2) : 3}
          maxLength={isList ? (field.max + 1) * (field.maxItems ?? 12) : field.max}
          className={fieldClasses}
        />
      )}
      {changed && (
        <p className="mt-1 text-xs text-foreground/50">
          Original: {Array.isArray(field.default) ? field.default.join(" · ") : field.default}
        </p>
      )}
    </div>
  );
}

export function PageTextForm({
  pageId,
  groups,
  values,
  version,
}: {
  pageId: string;
  groups: FieldGroup[];
  values: PageText;
  /** Changes after every save or reset, so the fields re-mount with what is stored now. */
  version: string;
}) {
  const [saveState, saveAction, saving] = useActionState(savePageText, initialCmsFormState);
  const [resetState, resetAction, resetting] = useActionState(resetPageText, initialCmsFormState);

  return (
    <div className="flex flex-col gap-10">
      <form action={saveAction} className="flex flex-col gap-8">
        <input type="hidden" name="page" value={pageId} />
        <div key={version} className="flex flex-col gap-8">
        {groups.map((group) => (
          <fieldset key={group.title} className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
            <legend className="px-1 text-sm font-semibold">{group.title}</legend>
            <div className="mt-2 flex flex-col gap-4">
              {group.fields.map((field) => (
                <Field key={field.key} field={field} value={values[field.key] ?? field.default} />
              ))}
            </div>
          </fieldset>
        ))}
        </div>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-black/10 bg-background/95 px-4 py-3 backdrop-blur dark:border-white/10">
          <button type="submit" disabled={saving} className={primaryButtonClasses}>
            {saving ? "Saving…" : "Save page text"}
          </button>
          <Message state={saveState} />
        </div>
      </form>

      <form action={resetAction} className="border-t border-black/10 pt-6 dark:border-white/10">
        <input type="hidden" name="page" value={pageId} />
        <h2 className="text-sm font-semibold">Reset to original</h2>
        <p className="mt-1 text-xs text-foreground/60">
          Puts every field on this page back to its original wording. Tip: to reset just one field, clear it and save.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={resetting} className={secondaryButtonClasses}>
            {resetting ? "Resetting…" : "Reset this page"}
          </button>
          <Message state={resetState} />
        </div>
      </form>
    </div>
  );
}

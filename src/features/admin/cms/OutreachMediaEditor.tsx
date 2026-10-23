"use client";

import { useActionState, useState } from "react";
import { deleteOutreachMedia, updateOutreachMedia } from "@/features/admin/cms/outreachMediaActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, secondaryButtonClasses } from "@/features/admin/ui";

export interface OutreachMediaEditorItem {
  id: string;
  kind: string;
  altText: string;
  caption: string;
  identifiable: boolean;
  children: boolean;
  patients: boolean;
  prisoners: boolean;
  writtenPermission: boolean;
  permissionNote: string;
  reviewed: boolean;
}

/** Description, caption and the consent checklist that decides whether the item can appear on the site. */
export function OutreachMediaEditor({ item }: { item: OutreachMediaEditorItem }) {
  const [state, formAction, pending] = useActionState(updateOutreachMedia, initialCmsFormState);
  const [flags, setFlags] = useState({
    identifiable: item.identifiable,
    children: item.children,
    patients: item.patients,
    prisoners: item.prisoners,
  });
  const [permission, setPermission] = useState(item.writtenPermission);
  const [reviewed, setReviewed] = useState(item.reviewed);

  const sensitive = Object.values(flags).some(Boolean);
  const cleared = reviewed && (!sensitive || permission);

  const flag = (key: keyof typeof flags, label: string) => (
    <label className="flex items-start gap-2">
      <input
        type="checkbox"
        name={key}
        checked={flags[key]}
        onChange={(event) => setFlags({ ...flags, [key]: event.target.checked })}
        className="mt-0.5"
      />
      {label}
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <p
        className={`rounded-lg px-3 py-2 text-xs font-medium ${
          cleared
            ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200"
            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        }`}
      >
        {cleared ? "Cleared — shown on the site when the outreach is published" : "Hidden from the site — consent checklist not complete"}
      </p>

      <form action={formAction} className="flex flex-col gap-3">
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

        <fieldset className="rounded-xl border border-black/10 p-3 text-xs dark:border-white/10">
          <legend className="px-1 font-semibold">Consent checklist — does this show…</legend>
          <div className="flex flex-col gap-2">
            {flag("identifiable", "People who can be recognised (faces, names, tattoos)")}
            {flag("children", "Children (under 18)")}
            {flag("patients", "Hospital patients")}
            {flag("prisoners", "Prisoners or detainees")}
          </div>

          {sensitive && (
            <div className="mt-3 flex flex-col gap-2 rounded-lg bg-amber-50 p-3 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="writtenPermission"
                  checked={permission}
                  onChange={(event) => setPermission(event.target.checked)}
                  className="mt-0.5"
                />
                Written permission was given for this to be published (by the person, or a parent/guardian for a
                child).
              </label>
              <label className="font-medium">
                Who gave permission, and where is it kept? <span className="font-normal opacity-70">(private)</span>
                <input
                  name="permissionNote"
                  defaultValue={item.permissionNote}
                  maxLength={500}
                  placeholder="e.g. Signed forms from all 3 adults, ministry office file"
                  className={fieldClasses}
                />
              </label>
              <p className="opacity-80">
                No permission? Consider cropping or blurring faces on your phone and uploading that version instead.
              </p>
            </div>
          )}
          {!sensitive && <input type="hidden" name="permissionNote" value={item.permissionNote} />}

          <label className="mt-3 flex items-start gap-2 font-medium">
            <input
              type="checkbox"
              name="reviewed"
              checked={reviewed}
              onChange={(event) => setReviewed(event.target.checked)}
              className="mt-0.5"
            />
            I have reviewed this {item.kind === "image" ? "photo" : "video"} against the checklist above.
          </label>
        </fieldset>

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

      <details className="text-xs">
        <summary className="cursor-pointer text-red-700 dark:text-red-400">Remove…</summary>
        <form action={deleteOutreachMedia} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <span className="text-foreground/60">This permanently deletes it.</span>
          <button type="submit" className="rounded-full bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800">
            Delete for good
          </button>
        </form>
      </details>
    </div>
  );
}

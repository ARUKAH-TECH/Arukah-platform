"use client";

import { useActionState, useState } from "react";
import { reviewAdvertiser } from "@/features/admin/cms/advertiserActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export function AdvertiserReviewForm({ id, status, reviewNote }: { id: string; status: string; reviewNote: string }) {
  const [state, formAction, pending] = useActionState(reviewAdvertiser, initialCmsFormState);
  const [decision, setDecision] = useState(status);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="text-sm font-medium">Decision</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approve advertiser" },
            { value: "rejected", label: "Reject" },
          ].map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="decision"
                value={option.value}
                checked={decision === option.value}
                onChange={() => setDecision(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-foreground/50">
          Approving the advertiser is only the first of three checks — each advert is approved separately, and payment
          must be confirmed before anything appears on the site.
        </p>
      </fieldset>
      <div>
        <label htmlFor="reviewNote" className="block text-sm font-medium">
          Private note <span className="font-normal text-foreground/50">(e.g. what you checked, agreed price)</span>
        </label>
        <textarea id="reviewNote" name="reviewNote" rows={4} maxLength={2000} defaultValue={reviewNote} className={fieldClasses} />
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
          {pending ? "Saving…" : "Save decision"}
        </button>
      </div>
    </form>
  );
}

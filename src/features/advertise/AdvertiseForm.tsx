"use client";

import { useActionState } from "react";
import { submitAdvertiserApplication } from "@/features/advertise/actions";
import { AD_PLACEMENT_OPTIONS, initialAdvertiseFormState } from "@/features/advertise/shared";
import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15";

export function AdvertiseForm() {
  const [state, formAction, pending] = useActionState(submitAdvertiserApplication, initialAdvertiseFormState);

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-2xl bg-green-50 p-6 text-sm font-medium text-green-900 dark:bg-green-950 dark:text-green-200">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0 }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium">
            Business name
          </label>
          <input id="businessName" name="businessName" required maxLength={150} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="contactName" className="block text-sm font-medium">
            Your name
          </label>
          <input id="contactName" name="contactName" required maxLength={150} className={inputClasses} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="adPhone" className="block text-sm font-medium">
            Phone
          </label>
          <input id="adPhone" name="phone" type="tel" maxLength={40} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="adEmail" className="block text-sm font-medium">
            Email
          </label>
          <input id="adEmail" name="email" type="email" maxLength={200} className={inputClasses} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-foreground/50">Please give at least a phone number or an email.</p>

      <div>
        <label htmlFor="website" className="block text-sm font-medium">
          Website or social page <span className="font-normal text-foreground/50">(optional)</span>
        </label>
        <input id="website" name="website" maxLength={300} placeholder="https://…" className={inputClasses} />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Where would you like to advertise?</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AD_PLACEMENT_OPTIONS.map((branch) => (
            <label key={branch.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="interestedIn" value={branch.id} />
              {branch.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="adMessage" className="block text-sm font-medium">
          Tell us about your business and what you&apos;d like to promote
        </label>
        <textarea id="adMessage" name="message" rows={5} maxLength={3000} className={inputClasses} />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send application"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { submitMinistryResponse } from "@/features/ministry/actions";
import { FAITH_STATUS_OPTIONS, initialMinistryFormState } from "@/features/ministry/shared";
import { Button } from "@/components/ui/Button";

interface MinistryFormProps {
  dark?: boolean;
}

export function MinistryForm({ dark = false }: MinistryFormProps) {
  const [state, formAction, pending] = useActionState(submitMinistryResponse, initialMinistryFormState);

  const inputClasses = dark
    ? "mt-1 w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-primary-text placeholder:text-white/40"
    : "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15";

  const labelClasses = dark ? "block text-sm font-medium text-white" : "block text-sm font-medium";
  const helpClasses = dark ? "-mt-2 text-xs text-white/50" : "-mt-2 text-xs text-foreground/50";

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

      <div>
        <label htmlFor="ministry-fullName" className={labelClasses}>
          Full Name
        </label>
        <input id="ministry-fullName" name="fullName" type="text" required className={inputClasses} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ministry-phone" className={labelClasses}>
            Phone
          </label>
          <input id="ministry-phone" name="phone" type="tel" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="ministry-email" className={labelClasses}>
            Email <span className="font-normal opacity-60">(optional)</span>
          </label>
          <input id="ministry-email" name="email" type="email" className={inputClasses} />
        </div>
      </div>
      <p className={helpClasses}>Please provide at least a phone number or an email.</p>

      <div>
        <label htmlFor="ministry-faithStatus" className={labelClasses}>
          Where are you in your faith journey?
        </label>
        <select id="ministry-faithStatus" name="faithStatus" required defaultValue="" className={inputClasses}>
          <option value="" disabled>
            Select an option
          </option>
          {FAITH_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ministry-message" className={labelClasses}>
          Message or prayer request <span className="font-normal opacity-60">(optional)</span>
        </label>
        <textarea id="ministry-message" name="message" rows={4} className={inputClasses} />
      </div>

      {state.status !== "idle" && (
        <p
          role="status"
          className={
            state.status === "success"
              ? "text-sm font-medium text-green-500"
              : "text-sm font-medium text-red-500"
          }
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Submit"}
      </Button>
    </form>
  );
}

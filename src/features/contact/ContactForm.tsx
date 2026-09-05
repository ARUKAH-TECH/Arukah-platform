"use client";

import { useActionState } from "react";
import { submitEnquiry } from "@/features/contact/actions";
import { SERVICE_OPTIONS, initialContactFormState } from "@/features/contact/shared";
import { Button } from "@/components/ui/Button";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialContactFormState);

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
        <label htmlFor="fullName" className="block text-sm font-medium">
          Full Name
        </label>
        <input id="fullName" name="fullName" type="text" required className={inputClasses} />
      </div>

      <div>
        <label htmlFor="organization" className="block text-sm font-medium">
          Organization / Business
        </label>
        <input id="organization" name="organization" type="text" className={inputClasses} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" className={inputClasses} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClasses} />
        </div>
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-medium">
          Service Required
        </label>
        <select
          id="service"
          name="service"
          required
          defaultValue=""
          className={inputClasses}
        >
          <option value="" disabled>
            Select a service
          </option>
          {SERVICE_OPTIONS.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message
        </label>
        <textarea id="message" name="message" required rows={5} className={inputClasses} />
      </div>

      {state.status !== "idle" && (
        <p
          role="status"
          className={
            state.status === "success"
              ? "text-sm font-medium text-green-700 dark:text-green-400"
              : "text-sm font-medium text-red-700 dark:text-red-400"
          }
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}

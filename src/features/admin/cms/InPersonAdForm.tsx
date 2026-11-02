"use client";

import { useActionState } from "react";
import { createInPersonAd } from "@/features/admin/cms/adRequestActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";

const field = "mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-base dark:border-white/15 dark:bg-zinc-950";

export function InPersonAdForm() {
  const [state, formAction, pending] = useActionState(createInPersonAd, initialCmsFormState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        Advertiser&apos;s name *
        <input name="contactName" required maxLength={150} className={field} />
      </label>
      <label className="text-sm font-medium">
        Business name
        <input name="businessName" maxLength={150} className={field} />
      </label>
      <label className="text-sm font-medium">
        Phone number *
        <input name="phone" type="tel" inputMode="tel" maxLength={40} className={field} />
        <span className="mt-1 block text-xs font-normal text-foreground/60">Only you see this. It is never shown on the website.</span>
      </label>
      <label className="text-sm font-medium">
        Email (optional)
        <input name="email" type="email" maxLength={200} className={field} />
      </label>
      <label className="text-sm font-medium">
        What the advert is about *
        <textarea name="about" required rows={4} maxLength={3000} className={field} />
      </label>
      <label className="text-sm font-medium">
        Location
        <input name="location" maxLength={200} placeholder="e.g. Nketia, Barekese Road" className={field} />
      </label>
      {state.status === "error" && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-[#0b3d91] px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Next: dates, payment and picture →"}
      </button>
    </form>
  );
}

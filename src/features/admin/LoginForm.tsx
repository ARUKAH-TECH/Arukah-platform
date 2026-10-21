"use client";

import { useActionState } from "react";
import { signIn } from "@/features/admin/actions";
import { initialAdminFormState } from "@/features/admin/shared";

export const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15";

export const submitClasses =
  "inline-flex w-full items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-medium text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialAdminFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClasses} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
        />
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={submitClasses}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

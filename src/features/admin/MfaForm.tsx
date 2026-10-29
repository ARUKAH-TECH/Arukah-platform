"use client";

import { useActionState, useState, useTransition } from "react";
import { startMfaEnroll, verifyMfa } from "@/features/admin/actions";
import { initialAdminFormState, initialMfaEnrollState, type MfaEnrollState } from "@/features/admin/shared";
import { inputClasses, submitClasses } from "@/features/admin/LoginForm";

interface MfaFormProps {
  /** A verified authenticator already exists — just ask for the code. */
  existingFactorId?: string;
}

export function MfaForm({ existingFactorId }: MfaFormProps) {
  const [enroll, setEnroll] = useState<MfaEnrollState>(initialMfaEnrollState);
  const [starting, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(verifyMfa, initialAdminFormState);

  const factorId = existingFactorId ?? enroll.factorId;

  if (!factorId) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground/70">
          Admin access needs a second step. Install an authenticator app (for example Google
          Authenticator or Microsoft Authenticator) on your phone, then continue.
        </p>
        {enroll.status === "error" && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {enroll.message}
          </p>
        )}
        <button
          type="button"
          disabled={starting}
          onClick={() => startTransition(async () => setEnroll(await startMfaEnroll()))}
          className={submitClasses}
        >
          {starting ? "Preparing…" : "Set up authenticator app"}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {enroll.qrCode && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-foreground/70">Scan this with your authenticator app:</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI from Supabase */}
          <img src={enroll.qrCode} alt="Authenticator setup QR code" width={180} height={180} className="rounded-lg bg-white p-2" />
          <p className="text-xs text-foreground/60">
            Can&apos;t scan? Enter this key instead:{" "}
            <code className="break-all font-mono">{enroll.secret}</code>
          </p>
        </div>
      )}
      <input type="hidden" name="factorId" value={factorId} />
      <div>
        <label htmlFor="code" className="block text-sm font-medium">
          6-digit code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
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
        {pending ? "Checking…" : "Verify"}
      </button>
    </form>
  );
}

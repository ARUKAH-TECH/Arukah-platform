"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { addFounderQuote, registerFounderPhoto } from "@/features/admin/cms/bibleActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";
import { IMAGE_PICKER_ACCEPT, resize } from "@/lib/resizeImage";

export function FounderQuoteForm() {
  const [state, action, pending] = useActionState(addFounderQuote, initialCmsFormState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Your quote
        <textarea name="text" required minLength={5} maxLength={320} rows={3} className={fieldClasses} placeholder="e.g. Whatever God starts in your life, He finishes. Keep trusting." />
      </label>
      <button type="submit" disabled={pending} className={`${primaryButtonClasses} w-fit`}>
        {pending ? "Saving…" : "Add quote"}
      </button>
      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-red-700" : "text-green-700 dark:text-green-400"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function FounderPhotoUploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload() {
    const files = Array.from(input.current?.files ?? []);
    if (!files.length) return;
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    let done = 0;
    try {
      for (const file of files) {
        setMessage({ ok: true, text: `Uploading photo ${done + 1} of ${files.length}…` });
        const { blob } = await resize(file, 1200);
        const storagePath = `${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage.from("media").upload(storagePath, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw new Error(error.message);
        const result = await registerFounderPhoto({ storagePath });
        if (result.status === "error") throw new Error(result.message);
        done += 1;
      }
      setMessage({ ok: true, text: `Added ${done} photo${done === 1 ? "" : "s"} ✓` });
      router.refresh();
    } catch (error) {
      setMessage({ ok: false, text: `Added ${done} of ${files.length}. ${error instanceof Error ? error.message : "Upload failed."}` });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input ref={input} id="founderPhotos" type="file" accept={IMAGE_PICKER_ACCEPT} multiple onChange={upload} className="hidden" />
      <label htmlFor="founderPhotos" className={`${secondaryButtonClasses} w-fit cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
        {busy ? "Uploading…" : "📷 Add photos of you"}
      </label>
      <p className="text-xs text-foreground/60">Clear photos where your face is near the top work best (it is shown in a circle).</p>
      {message && <p className={`text-sm ${message.ok ? "text-green-700 dark:text-green-400" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );
}

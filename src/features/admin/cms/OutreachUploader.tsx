"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { addOutreachVideo, registerOutreachImage } from "@/features/admin/cms/outreachMediaActions";
import { initialCmsFormState } from "@/features/admin/cms/shared";
import { IMAGE_PICKER_ACCEPT, resize } from "@/lib/resizeImage";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

/** Uploads photos to the PRIVATE outreach bucket. New photos start hidden until their consent checklist is done. */
export function OutreachImageUploader({ outreachId }: { outreachId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload() {
    const files = Array.from(fileInput.current?.files ?? []);
    if (files.length === 0) return;

    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    let done = 0;
    try {
      for (const file of files) {
        setMessage({ ok: true, text: `Preparing and uploading photo ${done + 1} of ${files.length}…` });
        const { blob, width, height } = await resize(file);
        const storagePath = `${outreachId}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("outreach-media")
          .upload(storagePath, blob, { contentType: "image/webp" });
        if (error) throw new Error(error.message);
        const result = await registerOutreachImage({ outreachId, storagePath, width, height, altText });
        if (result.status === "error") throw new Error(result.message);
        done += 1;
      }
      setMessage({
        ok: true,
        text: `Uploaded ${done} photo${done === 1 ? "" : "s"}. Each one stays hidden until you complete its consent checklist below.`,
      });
      setAltText("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Upload failed.";
      setMessage({ ok: false, text: `Uploaded ${done} of ${files.length}. ${reason}` });
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input id="outreachImages" ref={fileInput} type="file" accept={IMAGE_PICKER_ACCEPT} multiple onChange={upload} className="hidden" />
      <div>
        <label htmlFor="outreachAlt" className="block text-sm font-medium">
          Describe the photo <span className="font-normal text-foreground/60">(optional: type this first; for blind visitors and Google)</span>
        </label>
        <input
          id="outreachAlt"
          value={altText}
          maxLength={300}
          onChange={(event) => setAltText(event.target.value)}
          className={fieldClasses}
        />
      </div>
      {message && (
        <p
          role={message.ok ? "status" : "alert"}
          className={message.ok ? "text-sm text-green-700 dark:text-green-400" : "text-sm text-red-700 dark:text-red-400"}
        >
          {message.text}
        </p>
      )}
      <div>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className={primaryButtonClasses}>
          {busy ? "Uploading…" : "Choose photos"}
        </button>
        <p className="mt-2 text-xs text-foreground/60">They upload as soon as you pick them (resized, and location data removed, on your phone).</p>
      </div>
    </div>
  );
}

export function OutreachVideoForm({ outreachId }: { outreachId: string }) {
  const [state, formAction, pending] = useActionState(addOutreachVideo, initialCmsFormState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="outreachId" value={outreachId} />
      <div>
        <label htmlFor="outreachVideoUrl" className="block text-sm font-medium">
          YouTube or TikTok link
        </label>
        <input id="outreachVideoUrl" name="videoUrl" required placeholder="https://…" className={fieldClasses} />
      </div>
      <div>
        <label htmlFor="outreachVideoCaption" className="block text-sm font-medium">
          Caption <span className="font-normal text-foreground/60">(optional)</span>
        </label>
        <input id="outreachVideoCaption" name="caption" maxLength={500} className={fieldClasses} />
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
        <button type="submit" disabled={pending} className={secondaryButtonClasses}>
          {pending ? "Adding…" : "Add video"}
        </button>
      </div>
    </form>
  );
}

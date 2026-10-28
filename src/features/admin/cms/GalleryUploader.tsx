"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { registerGalleryPhoto } from "@/features/admin/cms/galleryActions";
import { IMAGE_PICKER_ACCEPT, resize } from "@/lib/resizeImage";
import { LOGO_STAMPS, stampLogo } from "@/lib/stampLogo";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";

export function GalleryUploader({ branch }: { branch: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const stamp = LOGO_STAMPS[branch];
  const [addLogo, setAddLogo] = useState(true);

  async function upload() {
    const files = Array.from(input.current?.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    const supabase = createClient();
    let done = 0;
    try {
      for (const file of files) {
        setMessage({ ok: true, text: `Preparing and uploading photo ${done + 1} of ${files.length}…` });
        const resized = await resize(file, 1600, 0.82);
        const { width, height } = resized;
        const blob = stamp && addLogo ? await stampLogo(resized.blob, width, height, stamp.src) : resized.blob;
        const storagePath = `gallery/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("media")
          .upload(storagePath, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw new Error(error.message);
        const result = await registerGalleryPhoto({ branch, storagePath, width, height, caption });
        if (!result.ok) throw new Error(result.message);
        done += 1;
      }
      setMessage({ ok: true, text: `Added ${done} photo${done === 1 ? "" : "s"} ✓ — they're on the page now.` });
      setCaption("");
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Upload failed.";
      setMessage({ ok: false, text: `Added ${done} of ${files.length}. ${reason}` });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        Caption <span className="font-normal text-foreground/50">(optional — type it first, e.g. &quot;Leather sandals, size 42&quot;)</span>
        <input value={caption} maxLength={300} onChange={(event) => setCaption(event.target.value)} className={fieldClasses} />
      </label>
      {stamp && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={addLogo} onChange={(event) => setAddLogo(event.target.checked)} className="h-4 w-4" />
          Add the {stamp.label} to each photo (bottom-right corner)
        </label>
      )}
      <input ref={input} type="file" accept={IMAGE_PICKER_ACCEPT} multiple onChange={upload} className="hidden" />
      <div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className={primaryButtonClasses}>
          {busy ? "Uploading…" : "Choose photos"}
        </button>
        <p className="mt-2 text-xs text-foreground/50">You can pick several at once. They upload as soon as you pick them.</p>
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-green-700 dark:text-green-400" : "text-sm font-medium text-red-700 dark:text-red-400"}>
          {message.text}
        </p>
      )}
    </div>
  );
}

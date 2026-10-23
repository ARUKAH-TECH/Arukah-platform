"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { registerImage } from "@/features/admin/cms/actions";
import { fieldClasses, primaryButtonClasses } from "@/features/admin/ui";
import { ACCEPTED_IMAGE_TYPES as ACCEPTED, resize } from "@/lib/resizeImage";

interface ImageUploaderProps {
  projects: { id: string; title: string }[];
  defaultProjectId?: string;
}

export function ImageUploader({ projects, defaultProjectId }: ImageUploaderProps) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload() {
    const files = Array.from(fileInput.current?.files ?? []);
    if (files.length === 0) {
      setMessage({ ok: false, text: "Choose at least one image." });
      return;
    }
    if (files.some((file) => !ACCEPTED.includes(file.type))) {
      setMessage({ ok: false, text: "Only JPEG, PNG or WebP images can be uploaded." });
      return;
    }

    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    let done = 0;
    try {
      for (const file of files) {
        const { blob, width, height } = await resize(file);
        const storagePath = `${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from("media")
          .upload(storagePath, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw new Error(error.message);

        const result = await registerImage({ storagePath, width, height, altText, projectId: projectId || null });
        if (result.status === "error") throw new Error(result.message);
        done += 1;
      }
      setMessage({ ok: true, text: `Uploaded ${done} image${done === 1 ? "" : "s"}.` });
      setAltText("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Upload failed.";
      setMessage({ ok: false, text: `Uploaded ${done} of ${files.length}. ${reason}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="images" className="block text-sm font-medium">
          Images <span className="font-normal text-foreground/50">(JPEG, PNG or WebP — resized automatically)</span>
        </label>
        <input id="images" ref={fileInput} type="file" accept={ACCEPTED.join(",")} multiple className="mt-1 text-sm" />
      </div>
      <div>
        <label htmlFor="altText" className="block text-sm font-medium">
          Describe the image <span className="font-normal text-foreground/50">(for blind visitors and Google)</span>
        </label>
        <input
          id="altText"
          value={altText}
          maxLength={300}
          onChange={(event) => setAltText(event.target.value)}
          className={fieldClasses}
        />
      </div>
      <div>
        <label htmlFor="uploadProject" className="block text-sm font-medium">
          Attach to project
        </label>
        <select id="uploadProject" value={projectId} onChange={(event) => setProjectId(event.target.value)} className={fieldClasses}>
          <option value="">None (keep in library)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
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
        <button type="button" onClick={upload} disabled={busy} className={primaryButtonClasses}>
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
    </div>
  );
}

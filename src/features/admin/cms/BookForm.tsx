"use client";

import { useActionState, useRef, useState } from "react";
import { saveBook } from "@/features/admin/cms/bookActions";
import { initialCmsFormState, slugify } from "@/features/admin/cms/shared";
import { IMAGE_PICKER_ACCEPT, resize } from "@/lib/resizeImage";
import { createClient } from "@/lib/supabase/browser";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

export interface BookFormValues {
  id?: string;
  title: string;
  slug: string;
  author: string;
  description: string;
  sampleText: string;
  coverPath: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  filePath: string | null;
  fileName: string;
  fileSize: number | null;
  priceRead: string;
  priceDownload: string;
  pricePrint: string;
  status: string;
  sortOrder: number;
}

function coverUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

export function BookForm({ book, justSaved }: { book: BookFormValues; justSaved?: boolean }) {
  const [state, formAction, pending] = useActionState(saveBook, initialCmsFormState);
  const [title, setTitle] = useState(book.title);
  const [slug, setSlug] = useState(book.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(book.id));
  const [cover, setCover] = useState({ path: book.coverPath, width: book.coverWidth, height: book.coverHeight });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [coverStep, setCoverStep] = useState("");
  const [pdf, setPdf] = useState({ path: book.filePath, name: book.fileName, size: book.fileSize });
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfStep, setPdfStep] = useState("");
  const [pdfError, setPdfError] = useState("");
  const pdfInput = useRef<HTMLInputElement>(null);
  const shown = state.status !== "idle" ? state : justSaved ? { status: "saved", message: "Saved." } : null;

  // Runs as soon as a photo is picked — no second button to press.
  async function uploadCover() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setCoverStep("Preparing the photo…");
    try {
      const { blob, width, height } = await resize(file, 1200, 0.85);
      setCoverStep("Uploading…");
      const path = `books/${crypto.randomUUID()}.webp`;
      const { error } = await createClient()
        .storage.from("media")
        .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      setCover({ path, width, height });
      setCoverStep("Cover uploaded ✓ — now press Save book.");
    } catch (error) {
      setCoverStep("");
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function uploadPdf() {
    const file = pdfInput.current?.files?.[0];
    if (!file) return;
    setPdfError("");
    // Check the file itself (every PDF starts with "%PDF-"): phones often
    // report the wrong type for files named .PDF in capitals.
    const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
    if (header !== "%PDF-") {
      if (pdfInput.current) pdfInput.current.value = "";
      return setPdfError("That file isn't a PDF. Choose the book's PDF file.");
    }
    if (file.size > 50 * 1024 * 1024) {
      if (pdfInput.current) pdfInput.current.value = "";
      return setPdfError(`This PDF is ${(file.size / 1048576).toFixed(0)} MB. The limit is 50 MB — try a compressed PDF.`);
    }
    setPdfBusy(true);
    setPdfStep(`Uploading ${(file.size / 1048576).toFixed(1)} MB… keep this page open.`);
    try {
      const path = `books/${crypto.randomUUID()}.pdf`;
      const { error } = await createClient()
        .storage.from("book-files")
        .upload(path, file, { contentType: "application/pdf" });
      if (error) throw new Error(error.message);
      setPdf({ path, name: file.name.slice(0, 200), size: file.size });
      setPdfStep("PDF uploaded ✓ — now press Save book.");
    } catch (error) {
      setPdfStep("");
      setPdfError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPdfBusy(false);
      if (pdfInput.current) pdfInput.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {book.id && <input type="hidden" name="id" value={book.id} />}
      <input type="hidden" name="coverPath" value={cover.path ?? ""} />
      <input type="hidden" name="coverWidth" value={cover.width ?? ""} />
      <input type="hidden" name="coverHeight" value={cover.height ?? ""} />
      <input type="hidden" name="filePath" value={pdf.path ?? ""} />
      <input type="hidden" name="fileName" value={pdf.name} />
      <input type="hidden" name="fileSize" value={pdf.size ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Title
          <input
            name="title"
            required
            maxLength={200}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            className={fieldClasses}
          />
        </label>
        <label className="text-sm font-medium">
          Author
          <input name="author" maxLength={150} defaultValue={book.author} className={fieldClasses} />
        </label>
      </div>

      <label className="text-sm font-medium">
        Web address
        <span className="mt-1 flex items-center gap-1 text-sm font-normal">
          <span className="shrink-0 text-foreground/60">/books/</span>
          <input
            name="slug"
            maxLength={80}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className={`${fieldClasses} mt-0`}
          />
        </span>
      </label>

      <div>
        <p className="text-sm font-medium">Cover</p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          {cover.path && (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={coverUrl(cover.path)} alt="" className="h-36 w-24 rounded-md object-cover shadow" />
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileInput} type="file" accept={IMAGE_PICKER_ACCEPT} onChange={uploadCover} className="hidden" />
            <div className="flex gap-3">
              <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className={secondaryButtonClasses}>
                {uploading ? "Uploading…" : cover.path ? "Change cover photo" : "Choose cover photo"}
              </button>
              {cover.path && (
                <button type="button" onClick={() => setCover({ path: null, width: null, height: null })} className="text-xs underline">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        {coverStep && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{coverStep}</p>}
        {uploadError && <p role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{uploadError}</p>}
        <p className="mt-1 text-xs text-foreground/60">Portrait book covers (2:3) look best. It uploads as soon as you pick it.</p>
      </div>

      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm font-semibold">Book file (PDF)</p>
        <p className="mt-1 text-xs text-foreground/60">
          Kept private. Buyers of &quot;Read online&quot; or &quot;Digital download&quot; get a link to it after paying. Up to 50 MB.
        </p>
        {pdf.path ? (
          <p className="mt-3 text-sm">
            📄 <span className="font-medium">{pdf.name || "Book PDF"}</span>
            {pdf.size ? <span className="text-foreground/60"> · {(pdf.size / 1048576).toFixed(1)} MB</span> : null}
          </p>
        ) : (
          <p className="mt-3 text-sm text-foreground/60">No PDF yet.</p>
        )}
        {/* No "accept" filter: on Android it can grey out PDFs named .PDF in capitals. The file is checked above instead. */}
        <input ref={pdfInput} type="file" onChange={uploadPdf} className="hidden" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => pdfInput.current?.click()} disabled={pdfBusy} className={secondaryButtonClasses}>
            {pdfBusy ? "Uploading…" : pdf.path ? "Replace PDF" : "Choose PDF"}
          </button>
          {pdf.path && !pdfBusy && (
            <button type="button" onClick={() => setPdf({ path: null, name: "", size: null })} className="text-xs underline">
              Remove
            </button>
          )}
        </div>
        {pdfStep && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{pdfStep}</p>}
        {pdfError && <p role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{pdfError}</p>}
      </div>

      <fieldset className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-semibold">Prices (GHS)</legend>
        <p className="text-xs text-foreground/60">Leave a format empty if it isn&apos;t offered for this book.</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-sm">
            Read online
            <input name="priceRead" inputMode="decimal" defaultValue={book.priceRead} className={fieldClasses} />
          </label>
          <label className="text-sm">
            Digital download
            <input name="priceDownload" inputMode="decimal" defaultValue={book.priceDownload} className={fieldClasses} />
          </label>
          <label className="text-sm">
            Printed copy
            <input name="pricePrint" inputMode="decimal" defaultValue={book.pricePrint} className={fieldClasses} />
          </label>
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        Description <span className="font-normal text-foreground/60">(blank line between paragraphs)</span>
        <textarea name="description" rows={6} maxLength={10000} defaultValue={book.description} className={fieldClasses} />
      </label>

      <label className="text-sm font-medium">
        Free sample <span className="font-normal text-foreground/60">(optional — a short excerpt visitors can read)</span>
        <textarea name="sampleText" rows={6} maxLength={20000} defaultValue={book.sampleText} className={fieldClasses} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Status
          <select name="status" defaultValue={book.status} className={fieldClasses}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (on the Books page)</option>
            <option value="archived">Archived (hidden)</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Order on the page <span className="font-normal text-foreground/60">(lower shows first)</span>
          <input name="sortOrder" type="number" defaultValue={book.sortOrder} className={fieldClasses} />
        </label>
      </div>

      {shown && (
        <p
          role={shown.status === "error" ? "alert" : "status"}
          className={shown.status === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-green-700 dark:text-green-400"}
        >
          {shown.message}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending || uploading || pdfBusy} className={primaryButtonClasses}>
          {pending ? "Saving…" : "Save book"}
        </button>
      </div>
    </form>
  );
}

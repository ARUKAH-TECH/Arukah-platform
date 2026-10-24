"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { extractPdfPages } from "@/lib/loadPdfJs";
import { pageToText } from "@/lib/bookText";
import { finishBookPages, saveBookPages, saveHighlights, suggestHighlights } from "@/features/admin/cms/bookReaderActions";
import { fieldClasses, primaryButtonClasses, secondaryButtonClasses } from "@/features/admin/ui";

interface Props {
  bookId: string;
  slug: string;
  filePath: string | null;
  pageCount: number;
  highlights: string[];
}

/** Admin: turn the saved PDF into the online-reader text, and pick catchy lines. */
export function BookReaderPanel({ bookId, slug, filePath, pageCount, highlights }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [lines, setLines] = useState(highlights.join("\n"));
  const [lineMessage, setLineMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function prepare() {
    if (!filePath) return;
    setBusy(true);
    setError("");
    try {
      setStep("Opening the PDF…");
      const { data, error: downloadError } = await createClient().storage.from("book-files").download(filePath);
      if (downloadError || !data) throw new Error("Couldn't open the saved PDF. Try uploading it again.");
      const pages = await extractPdfPages(await data.arrayBuffer(), pageToText, (done, total) =>
        setStep(`Reading page ${done} of ${total}…`),
      );
      if (pages.every((page) => !page.trim())) {
        throw new Error("No text was found in this PDF (it may be scanned pictures). Export the PDF from Word or Google Docs and upload that.");
      }
      setStep("Saving…");
      const size = 10;
      for (let start = 0; start < pages.length; start += size) {
        const result = await saveBookPages({ bookId, firstPage: start + 1, pages: pages.slice(start, start + size), replace: start === 0 });
        if (!result.ok) throw new Error(result.message);
      }
      await finishBookPages(bookId, slug, pages.length);
      setStep(`Ready ✓ — ${pages.length} pages are in the online reader.`);
      router.refresh();
    } catch (err) {
      setStep("");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 flex max-w-3xl flex-col gap-6 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
      <div>
        <h2 className="text-sm font-semibold">Online reader (with read-aloud)</h2>
        <p className="mt-1 text-sm text-foreground/70">
          {pageCount > 0 ? `${pageCount} pages are ready for reading online.` : "Not prepared yet."}{" "}
          {pageCount > 0 && (
            <Link href={`/books/${slug}/read`} target="_blank" className="font-semibold text-brand-primary-text underline">
              Preview the reader
            </Link>
          )}
        </p>
        {filePath ? (
          <button type="button" onClick={prepare} disabled={busy} className={`${primaryButtonClasses} mt-3`}>
            {busy ? "Preparing…" : pageCount > 0 ? "Prepare again from the PDF" : "Prepare reader from the PDF"}
          </button>
        ) : (
          <p className="mt-3 text-sm text-foreground/60">Upload the book PDF above and press Save book first.</p>
        )}
        {step && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{step}</p>}
        {error && (
          <p role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold">Catchy lines</h2>
        <p className="mt-1 text-sm text-foreground/70">
          One per line. They show on the book page as &quot;Lines readers love&quot; and are highlighted in the reader. Copy them exactly from the
          book so the highlight finds them.
        </p>
        <textarea value={lines} onChange={(event) => setLines(event.target.value)} rows={6} className={fieldClasses} />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || pageCount === 0}
            onClick={() =>
              startTransition(async () => {
                const picks = await suggestHighlights(bookId);
                setLines(picks.join("\n"));
                setLineMessage(picks.length ? "Suggestions added — edit them, then press Save lines." : "No suggestions found.");
              })
            }
            className={secondaryButtonClasses}
          >
            ✨ Suggest from the book
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await saveHighlights(bookId, slug, lines);
                setLineMessage(result.message);
              })
            }
            className={primaryButtonClasses}
          >
            Save lines
          </button>
        </div>
        {lineMessage && <p className="mt-2 text-sm text-foreground/70">{lineMessage}</p>}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { secondaryButtonClasses } from "@/features/admin/ui";
import { FounderPhotoUploader, FounderQuoteForm } from "@/features/admin/cms/FounderQuotes";
import { deleteFounderQuote, setFounderPhotoHidden, setFounderQuoteStatus } from "@/features/admin/cms/bibleActions";
import { FOUNDER } from "@/config/founder";

export const metadata: Metadata = { title: "My quotes & photos" };

const photoUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;

export default async function FounderQuotesPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: quotes }, { data: photos }] = await Promise.all([
    supabase.from("founder_quotes").select("id, text, status, created_at").order("created_at", { ascending: false }),
    supabase.from("founder_photos").select("id, storage_path, hidden").order("created_at", { ascending: false }),
  ]);

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/bible" className="text-sm text-foreground/60 hover:underline">
        ← Bible app
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">✍️ My quotes &amp; photos</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Your quotes take turns with Bible verses and book lines as the homepage &quot;quote of the day&quot;. When shared, they become a picture with your photo,
        your name and the month&apos;s background.
      </p>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Add a quote</h2>
        <div className="mt-3">
          <FounderQuoteForm />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Your quotes ({quotes?.length ?? 0})</h2>
        {!quotes?.length ? (
          <p className="mt-2 text-sm text-foreground/60">No quotes yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {quotes.map((q) => (
              <li key={q.id} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
                <p className="font-serif">“{q.text}”</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${q.status === "published" ? "bg-green-100 text-green-900" : "bg-black/5"}`}>{q.status === "published" ? "In use" : "Hidden"}</span>
                  {q.status === "published" && (
                    <a href={`/api/share-card?fq=${q.id}&preview=${Date.now()}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                      🖼 See picture
                    </a>
                  )}
                  <form action={setFounderQuoteStatus}>
                    <input type="hidden" name="id" value={q.id} />
                    <input type="hidden" name="status" value={q.status === "published" ? "draft" : "published"} />
                    <button type="submit" className={secondaryButtonClasses}>
                      {q.status === "published" ? "Hide" : "Use again"}
                    </button>
                  </form>
                  <form action={deleteFounderQuote}>
                    <input type="hidden" name="id" value={q.id} />
                    <button type="submit" className="text-red-700 underline">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Your photos</h2>
        <p className="mt-1 text-sm text-foreground/60">The pictures take turns using these photos. With none added, your main photo is used.</p>
        <div className="mt-3">
          <FounderPhotoUploader />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {!photos?.length && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={FOUNDER.photo.src} alt="Main photo" className="aspect-square w-full rounded-full border-2 border-[#e3a82a] object-cover object-top" />
          )}
          {(photos ?? []).map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p.storage_path)} alt="" className={`aspect-square w-full rounded-full border-2 border-[#e3a82a] object-cover object-top ${p.hidden ? "opacity-40" : ""}`} />
              <form action={setFounderPhotoHidden}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="hidden" value={p.hidden ? "false" : "true"} />
                <button type="submit" className="text-xs underline">
                  {p.hidden ? "Use again" : "Don't use"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdvertiserReviewForm } from "@/features/admin/cms/AdvertiserReviewForm";
import { deleteAdvertiser } from "@/features/admin/cms/advertiserActions";
import { branchLabel } from "@/config/branches";

export const metadata: Metadata = { title: "Advertiser application" };

export default async function AdvertiserPage({ params }: PageProps<"/admin/advertisers/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("advertisers")
    .select("id, business_name, contact_name, email, phone, website, interested_in, message, status, review_note, created_at, reviewed_at")
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();

  const received = new Date(item.created_at).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  });
  const phoneDigits = item.phone.replace(/[^\d+]/g, "");

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/advertisers" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All advertisers
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{item.business_name}</h1>
      <p className="mt-1 text-sm text-foreground/60">Received {received}</p>

      <div className="mt-8 grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
        <dl className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-900">
          <div>
            <dt className="text-xs uppercase tracking-wider text-foreground/50">Contact</dt>
            <dd className="mt-1 font-medium">{item.contact_name}</dd>
          </div>
          {item.phone && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-foreground/50">Phone</dt>
              <dd className="mt-1 flex flex-wrap gap-3">
                <a href={`tel:${phoneDigits}`} className="font-medium text-brand-primary-text hover:underline">
                  {item.phone}
                </a>
                <a
                  href={`https://wa.me/${phoneDigits.replace(/^\+/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                >
                  WhatsApp
                </a>
              </dd>
            </div>
          )}
          {item.email && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-foreground/50">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${item.email}`} className="font-medium text-brand-primary-text hover:underline">
                  {item.email}
                </a>
              </dd>
            </div>
          )}
          {item.website && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-foreground/50">Website</dt>
              <dd className="mt-1 break-all">
                <a href={item.website} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                  {item.website}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wider text-foreground/50">Interested in</dt>
            <dd className="mt-1">{(item.interested_in as string[]).map(branchLabel).join(", ") || "—"}</dd>
          </div>
          {item.message && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-foreground/50">Message</dt>
              <dd className="mt-1 whitespace-pre-line leading-6 text-foreground/80">{item.message}</dd>
            </div>
          )}
        </dl>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <AdvertiserReviewForm id={item.id} status={item.status} reviewNote={item.review_note} />
        </div>
      </div>

      <section className="mt-12 max-w-4xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this application…</summary>
          <form action={deleteAdvertiser} className="mt-3">
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}

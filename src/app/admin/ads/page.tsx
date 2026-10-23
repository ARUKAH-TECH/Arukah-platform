import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdSettingsForm } from "@/features/admin/cms/AdSettingsForm";
import { AD_TONE_CLASSES, adStatus } from "@/features/admin/cms/adStatus";
import { primaryButtonClasses } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Adverts" };

function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default async function AdminAdsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: ads }, { data: advertisers }, { data: settings }] = await Promise.all([
    supabase
      .from("ads")
      .select("id, headline, advertiser_id, content_status, payment_confirmed, starts_on, ends_on")
      .order("starts_on", { ascending: false }),
    supabase.from("advertisers").select("id, business_name, status"),
    supabase.from("ad_settings").select("branch, accepts_ads"),
  ]);
  const advertiserById = new Map((advertisers ?? []).map((a) => [a.id as string, a]));
  const accepting = (settings ?? []).filter((row) => row.accepts_ads).map((row) => row.branch as string);
  const approvedAdvertisers = (advertisers ?? []).filter((a) => a.status === "approved").length;

  return (
    <AdminShell email={admin.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Adverts</h1>
        <Link href="/admin/ads/new" className={primaryButtonClasses}>
          New advert
        </Link>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        An advert shows only when its advertiser is approved, its content is approved, payment is confirmed, and today is
        within its dates.
        {approvedAdvertisers === 0 && " Approve an advertiser first under Advertisers."}
      </p>

      {!ads?.length ? (
        <p className="mt-8 text-sm text-foreground/60">No adverts yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-xs uppercase tracking-wider text-foreground/50 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Advert</th>
                <th className="px-4 py-3 font-medium">Advertiser</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => {
                const advertiser = advertiserById.get(ad.advertiser_id);
                const status = adStatus({
                  advertiserStatus: advertiser?.status ?? "pending",
                  contentStatus: ad.content_status,
                  paymentConfirmed: ad.payment_confirmed,
                  startsOn: ad.starts_on,
                  endsOn: ad.ends_on,
                });
                return (
                  <tr key={ad.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="px-4 py-3">
                      <Link href={`/admin/ads/${ad.id}`} className="font-medium hover:text-brand-primary-text">
                        {ad.headline}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/70">{advertiser?.business_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-foreground/70">
                      {formatDay(ad.starts_on)} – {formatDay(ad.ends_on)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${AD_TONE_CLASSES[status.tone]}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-12 max-w-3xl rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Pages that show adverts</h2>
        <p className="mt-1 mb-4 text-xs text-foreground/60">
          Untick a page to hide every advert there at once. The ministry pages never show adverts.
        </p>
        <AdSettingsForm accepting={accepting} />
      </section>
    </AdminShell>
  );
}

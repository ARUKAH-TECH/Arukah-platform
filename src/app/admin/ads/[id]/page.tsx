import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdForm } from "@/features/admin/cms/AdForm";
import { deleteAd } from "@/features/admin/cms/adActions";

export const metadata: Metadata = { title: "Edit advert" };

export default async function EditAdPage({ params, searchParams }: PageProps<"/admin/ads/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: ad }, { data: payment }, { data: advertisers }] = await Promise.all([
    supabase
      .from("ads")
      .select(
        "id, advertiser_id, format, headline, body, cta_label, image_path, image_width, image_height, destination_url, placements, content_status, payment_confirmed, starts_on, ends_on",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("ad_payments").select("amount_ghs, reference, note").eq("ad_id", id).maybeSingle(),
    supabase.from("advertisers").select("id, business_name, status").order("business_name"),
  ]);
  if (!ad) notFound();

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/ads" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All adverts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{ad.headline}</h1>
      <div className="mt-8 max-w-3xl">
        <AdForm
          justSaved={saved === "1"}
          advertisers={(advertisers ?? []).map((a) => ({ id: a.id, name: a.business_name, status: a.status }))}
          ad={{
            id: ad.id,
            advertiserId: ad.advertiser_id,
            headline: ad.headline,
            body: ad.body,
            ctaLabel: ad.cta_label,
            imagePath: ad.image_path,
            imageWidth: ad.image_width,
            imageHeight: ad.image_height,
            destinationUrl: ad.destination_url,
            placements: ad.placements,
            contentStatus: ad.content_status,
            paymentConfirmed: ad.payment_confirmed,
            startsOn: ad.starts_on,
            endsOn: ad.ends_on,
            amountGhs: payment?.amount_ghs != null ? String(payment.amount_ghs) : "",
            paymentReference: payment?.reference ?? "",
            paymentNote: payment?.note ?? "",
            format: ad.format === "banner" ? "banner" : "card",
          }}
        />
      </div>

      <section className="mt-12 max-w-3xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this advert…</summary>
          <p className="mt-2 text-xs text-foreground/60">To stop it showing but keep the record, set the content to rejected or end its dates.</p>
          <form action={deleteAd} className="mt-3">
            <input type="hidden" name="id" value={ad.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}

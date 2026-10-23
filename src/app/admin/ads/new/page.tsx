import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdForm } from "@/features/admin/cms/AdForm";
import { todayInGhana } from "@/features/admin/cms/adStatus";

export const metadata: Metadata = { title: "New advert" };

export default async function NewAdPage({ searchParams }: PageProps<"/admin/ads/new">) {
  const admin = await requireAdmin();
  const { advertiser } = await searchParams;
  const supabase = await createClient();
  const { data: advertisers } = await supabase
    .from("advertisers")
    .select("id, business_name, status")
    .neq("status", "rejected")
    .order("business_name");
  const today = todayInGhana();
  const inAMonth = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const preselected = typeof advertiser === "string" ? advertiser : "";

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/ads" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All adverts
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New advert</h1>
      <div className="mt-8 max-w-3xl">
        <AdForm
          advertisers={(advertisers ?? []).map((a) => ({ id: a.id, name: a.business_name, status: a.status }))}
          ad={{
            advertiserId: preselected,
            headline: "",
            body: "",
            ctaLabel: "",
            imagePath: null,
            imageWidth: null,
            imageHeight: null,
            destinationUrl: "",
            placements: [],
            contentStatus: "pending",
            paymentConfirmed: false,
            startsOn: today,
            endsOn: inAMonth,
            amountGhs: "",
            paymentReference: "",
            paymentNote: "",
          }}
        />
      </div>
    </AdminShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getOutreachRaised, getPublicOutreaches } from "@/db/outreaches";
import { GivingProgress } from "@/features/outreach/GivingProgress";
import { SupportForm } from "@/features/payments/SupportForm";
import { paymentsEnabled } from "@/server/payments";
import { ONLINE_FORMS_ENABLED } from "@/config/forms";
import { QuickGiveForm } from "@/features/payments/QuickGiveForm";
import { quickPaymentsEnabled } from "@/server/quickPayments";
import { SharePage } from "@/components/ui/SharePage";

export const metadata: Metadata = {
  title: "Support the outreach · Repent Online Ministries",
  description: "Give towards hospital, prison, street and community outreach by Repent Online Ministries, by Mobile Money or card.",
  alternates: { canonical: "/ministry/support" },
  openGraph: { title: "Support the outreach · Repent Online Ministries | ZIVARUKAH", description: "Give towards hospital, prison, street and community outreach by Repent Online Ministries, by Mobile Money or card." },
};

export const revalidate = 60;

export default async function SupportPage({ searchParams }: PageProps<"/ministry/support">) {
  const { outreach } = await searchParams;
  const all = await getPublicOutreaches(60);
  const outreaches = all.map((o) => ({ id: o.id, title: o.title, slug: o.slug }));
  // Outreaches with a fundraising goal, with what has been raised so far.
  const campaigns = await Promise.all(all.filter((o) => o.goal).slice(0, 4).map(async (o) => ({ ...o, raised: await getOutreachRaised(o.id) })));
  const preselect = outreaches.find((o) => o.slug === outreach)?.id ?? "";
  const enabled = ONLINE_FORMS_ENABLED && paymentsEnabled();

  return (
    <div data-brand="ministry" className="flex-1 bg-black text-white">
      <Container>
        <div className="mx-auto max-w-xl py-16">
          <Link href="/ministry/outreach" className="text-sm text-white/60 hover:text-brand-primary-text">
            ← Outreach
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Support the outreach</h1>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Your gift helps us visit hospitals and prisons, feed people on the streets, support the needy and reach communities with the Gospel. Give
            any amount by Mobile Money or card: no account needed.
          </p>
          {campaigns.length > 0 && (
            <div className="mt-8 flex flex-col gap-4">
              {campaigns.map((c) => (
                <GivingProgress key={c.id} raised={c.raised} goal={c.goal!} slug={c.slug} title={c.title} compact />
              ))}
            </div>
          )}
          <div className="mt-10">
            {enabled ? (
              <SupportForm outreaches={outreaches.map(({ id, title }) => ({ id, title }))} preselect={preselect} />
            ) : (
              quickPaymentsEnabled() ? (
                <QuickGiveForm outreaches={outreaches.map(({ id, title }) => ({ id, title }))} preselect={preselect} />
              ) : (
                <p className="rounded-2xl border border-white/15 p-6 text-sm leading-6 text-white/70">
                  Online giving is being set up. Please check back soon. Thank you and God bless you.
                </p>
              )
            )}
          </div>
        </div>
      </Container>
      <SharePage
        path="/ministry/support"
        title="Support the outreach"
        message={"🙏 *Support the outreach: Repent Online Ministries*\n\nHelp us visit hospitals and prisons, feed people on the streets and reach communities with the Gospel. Give by Mobile Money or card 👇"}
        heading="💛 Share this giving page"
        note="Every share helps more people join the outreach."
        dark
      />
    </div>
  );
}

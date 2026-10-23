import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getPublicOutreaches } from "@/db/outreaches";
import { SupportForm } from "@/features/payments/SupportForm";
import { paymentsEnabled } from "@/server/payments";
import { WhatsAppContact } from "@/components/ui/WhatsAppContact";
import { ONLINE_FORMS_ENABLED } from "@/config/forms";
import { QuickGiveForm } from "@/features/payments/QuickGiveForm";
import { quickPaymentsEnabled } from "@/server/quickPayments";

export const metadata: Metadata = {
  title: "Support the outreach · Repent Online Ministries",
  description: "Give towards hospital, prison, street and community outreach by Repent Online Ministries — by Mobile Money or card.",
  alternates: { canonical: "/ministry/support" },
};

export const revalidate = 60;

export default async function SupportPage({ searchParams }: PageProps<"/ministry/support">) {
  const { outreach } = await searchParams;
  const outreaches = (await getPublicOutreaches(60)).map((o) => ({ id: o.id, title: o.title, slug: o.slug }));
  const preselect = outreaches.find((o) => o.slug === outreach)?.id ?? "";
  const preselectTitle = outreaches.find((o) => o.slug === outreach)?.title ?? "";
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
            Your gift helps us visit hospitals and prisons, feed people on the streets and reach communities with the Gospel.
          </p>
          <div className="mt-10">
            {enabled ? (
              <SupportForm outreaches={outreaches.map(({ id, title }) => ({ id, title }))} preselect={preselect} />
            ) : (
              <div className="flex flex-col gap-6">
              {quickPaymentsEnabled() && (
                <QuickGiveForm outreaches={outreaches.map(({ id, title }) => ({ id, title }))} preselect={preselect} />
              )}
              <WhatsAppContact
                dark
                message={`Hello Repent Online Ministries, I would like to support the outreach${preselectTitle ? ` "${preselectTitle}"` : ""}.`}
                label="Give via WhatsApp"
                note="Message or call us and we'll share how to give by Mobile Money. Thank you and God bless you."
              />
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

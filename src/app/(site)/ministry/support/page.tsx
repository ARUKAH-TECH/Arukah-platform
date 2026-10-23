import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getPublicOutreaches } from "@/db/outreaches";
import { SupportForm } from "@/features/payments/SupportForm";
import { paymentsEnabled } from "@/server/payments";

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
  const enabled = paymentsEnabled();

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
              <div className="rounded-2xl border border-white/15 p-6 text-sm leading-6 text-white/80">
                <p className="font-semibold text-white">Online giving opens soon.</p>
                <p className="mt-2">
                  Until then, please{" "}
                  <Link href="/contact" className="font-semibold text-brand-primary-text underline">
                    contact us
                  </Link>{" "}
                  and we&apos;ll share how to give by Mobile Money.
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

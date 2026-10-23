import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getPublicOutreaches } from "@/db/outreaches";
import { OutreachCard } from "@/features/outreach/OutreachCard";

export const metadata: Metadata = {
  title: "Outreach · Repent Online Ministries",
  description: "Hospital, prison, street, community and crusade outreach by Repent Online Ministries.",
  alternates: { canonical: "/ministry/outreach" },
};

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export default async function OutreachListPage() {
  const outreaches = await getPublicOutreaches(60);

  return (
    <div data-brand="ministry" className="flex-1 bg-black text-white">
      <Container>
        <div className="py-16">
          <Link href="/ministry" className="text-sm text-white/60 hover:text-brand-primary-text">
            ← Repent Online Ministries
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Outreach</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
            Hospital, prison, street, community and crusade outreach — taking the message beyond the screen.
          </p>

          {outreaches.length === 0 ? (
            <p className="mt-10 text-sm text-white/60">Outreach reports will appear here soon.</p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {outreaches.map((outreach) => (
                <OutreachCard key={outreach.id} outreach={outreach} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

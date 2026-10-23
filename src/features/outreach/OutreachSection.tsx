import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getPublicOutreaches } from "@/db/outreaches";
import { OutreachCard } from "@/features/outreach/OutreachCard";

/** Latest outreaches for the ministry page. Renders nothing until one is published. */
export async function OutreachSection() {
  const outreaches = await getPublicOutreaches(4);
  if (outreaches.length === 0) return null;
  const shown = outreaches.slice(0, 3);

  return (
    <section className="border-t border-white/10 py-16">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Outreach</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">Where the ministry has been</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((outreach) => (
            <OutreachCard key={outreach.id} outreach={outreach} />
          ))}
        </div>
        {outreaches.length > shown.length && (
          <Link
            href="/ministry/outreach"
            className="mt-8 inline-block text-sm font-semibold text-brand-primary-text hover:underline"
          >
            All outreach →
          </Link>
        )}
      </Container>
    </section>
  );
}

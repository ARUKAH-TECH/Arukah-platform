import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getPublicOutreach } from "@/db/outreaches";
import { formatOutreachDate, outreachTypeLabel } from "@/config/outreach";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/ministry/outreach/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const outreach = await getPublicOutreach(slug);
  if (!outreach) return {};
  return {
    title: `${outreach.title} · Repent Online Ministries`,
    description: outreach.purpose || undefined,
    alternates: { canonical: `/ministry/outreach/${outreach.slug}` },
  };
}

export default async function OutreachPage({ params }: PageProps<"/ministry/outreach/[slug]">) {
  const { slug } = await params;
  const outreach = await getPublicOutreach(slug);
  if (!outreach) notFound();

  const paragraphs = outreach.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const date = formatOutreachDate(outreach.date);

  return (
    <article data-brand="ministry" className="flex-1 bg-black text-white">
      <Container>
        <div className="max-w-3xl py-16">
          <Link href="/ministry/outreach" className="text-sm text-white/60 hover:text-brand-primary-text">
            ← All outreach
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            {outreachTypeLabel(outreach.type)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{outreach.title}</h1>

          {(date || outreach.location) && (
            <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {date && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/50">Date</dt>
                  <dd className="mt-1 font-medium">{date}</dd>
                </div>
              )}
              {outreach.location && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-white/50">Location</dt>
                  <dd className="mt-1 font-medium">{outreach.location}</dd>
                </div>
              )}
            </dl>
          )}

          {outreach.purpose && (
            <p className="mt-8 text-lg leading-8 text-white/80">{outreach.purpose}</p>
          )}

          {paragraphs.length > 0 && (
            <div className="mt-8 flex flex-col gap-4 text-sm leading-7 text-white/70">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {outreach.needs.length > 0 && (
            <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-primary-text">What was needed</h2>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-white/80">
                {outreach.needs.map((need) => (
                  <li key={need} className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                    {need}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12">
            <Button href="/ministry#respond" variant="outline">
              Get in touch with the ministry
            </Button>
          </div>
        </div>
      </Container>
    </article>
  );
}

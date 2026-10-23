import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getPublicOutreach, getPublicOutreachMedia } from "@/db/outreaches";
import { parseVideoLink } from "@/lib/video";
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
  const media = await getPublicOutreachMedia(outreach.id);
  const photos = media.filter((item) => item.kind === "image");
  const videos = media
    .filter((item) => item.kind === "video_link")
    .map((item) => ({ item, video: parseVideoLink(item.url) }))
    .filter((entry) => entry.video !== null);

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

          {photos.length > 0 && (
            <section className="mt-10">
              <h2 className="sr-only">Photos</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {photos.map((photo) => (
                  <figure key={photo.id} className="flex flex-col gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- served via the consent-checked /outreach-photo route */}
                    <img
                      src={photo.url}
                      alt={photo.altText}
                      width={photo.width ?? undefined}
                      height={photo.height ?? undefined}
                      loading="lazy"
                      className="w-full rounded-xl bg-white/5 object-cover"
                    />
                    {photo.caption && <figcaption className="text-xs text-white/60">{photo.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section className="mt-10 flex flex-col gap-6">
              <h2 className="sr-only">Videos</h2>
              {videos.map(({ item, video }) =>
                video?.platform === "youtube" ? (
                  <figure key={item.id} className="flex flex-col gap-2">
                    <iframe
                      src={video.embedUrl}
                      title={item.caption || outreach.title}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="aspect-video w-full rounded-xl"
                    />
                    {item.caption && <figcaption className="text-xs text-white/60">{item.caption}</figcaption>}
                  </figure>
                ) : (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm font-medium hover:border-brand-primary-text"
                  >
                    Watch on TikTok ↗{item.caption && <span className="ml-2 font-normal text-white/60">{item.caption}</span>}
                  </a>
                ),
              )}
            </section>
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

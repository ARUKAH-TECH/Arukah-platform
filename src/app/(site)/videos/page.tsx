import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SharePage } from "@/components/ui/SharePage";
import { FOUNDER, founderLd } from "@/config/founder";
import { getVideos, type Video } from "@/server/videos";

export const revalidate = 21600;

const SITE = process.env.SITE_URL || "https://zivarukah.com";

export const metadata: Metadata = {
  title: `Videos: ${FOUNDER.name}`,
  description: `Watch videos by ${FOUNDER.name}: sermons, Repent Online Ministries outreach, devotionals and ZIVARUKAH work, from YouTube, TikTok and Facebook.`,
  alternates: { canonical: "/videos" },
};

const BADGE: Record<Video["platform"], string> = { youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook" };

export default async function VideosPage() {
  const videos = await getVideos();
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      founderLd(SITE),
      {
        "@type": "ItemList",
        name: `Videos by ${FOUNDER.name}`,
        itemListElement: videos.filter((v) => v.embedUrl).map((v, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/videos/${v.key}` })),
      },
    ],
  };
  return (
    <main className="py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Watch</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Videos by {FOUNDER.name}</h1>
        <p className="mt-3 max-w-2xl text-foreground/70">Sermons, outreach, devotionals and our work at ZIVARUKAH. New YouTube videos appear here automatically. Follow for more:</p>
        <SocialLinks className="mt-4" />
        {videos.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-black/10 p-6 text-foreground/70 dark:border-white/10">Videos are loading from our channels. Please check back shortly.</p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => {
              const href = v.embedUrl ? `/videos/${v.key}` : v.url;
              const external = !v.embedUrl;
              return (
                <li key={v.key}>
                  <Link href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group block overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                    <div className="relative aspect-video bg-black/80">
                      {v.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-4xl text-white/70">▶</span>
                      )}
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">{BADGE[v.platform]}</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-xl text-white">▶</span>
                      </span>
                    </div>
                    <div className="p-4">
                      <h2 className="line-clamp-2 font-semibold group-hover:text-brand-primary-text">{v.title}</h2>
                      {v.published && <p className="mt-1 text-xs text-foreground/60">{new Date(v.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-10">
          <SharePage title={`Videos by ${FOUNDER.name}`} path="/videos" />
        </div>
      </Container>
    </main>
  );
}

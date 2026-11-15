import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { FOUNDER } from "@/config/founder";
import { getVideo } from "@/server/videos";

export const revalidate = 21600;

const SITE = process.env.SITE_URL || "https://zivarukah.com";

export async function generateMetadata({ params }: PageProps<"/videos/[key]">): Promise<Metadata> {
  const { key } = await params;
  const v = await getVideo(key);
  if (!v) return { title: "Video" };
  const description = (v.description || `${v.title}: a video by ${FOUNDER.name}.`).slice(0, 160);
  return {
    title: v.title,
    description,
    alternates: { canonical: `/videos/${v.key}` },
    openGraph: { title: v.title, description, type: "video.other", images: v.thumbnail ? [v.thumbnail] : undefined },
  };
}

export default async function VideoPage({ params }: PageProps<"/videos/[key]">) {
  const { key } = await params;
  const v = await getVideo(key);
  if (!v) notFound();
  const tall = v.platform === "tiktok";
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description || `${v.title}: a video by ${FOUNDER.name}.`,
    thumbnailUrl: v.thumbnail ? [v.thumbnail] : undefined,
    uploadDate: v.published ?? undefined,
    embedUrl: v.embedUrl,
    url: `${SITE}/videos/${v.key}`,
    creator: { "@id": `${SITE}/#founder`, "@type": "Person", name: FOUNDER.name },
    publisher: { "@id": `${SITE}/#organization` },
    sameAs: v.url,
  };
  return (
    <main className="py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Container>
        <Link href="/videos" className="text-sm font-semibold text-brand-primary-text">
          ← All videos
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{v.title}</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {FOUNDER.name}
          {v.published ? ` · ${new Date(v.published).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}
        </p>
        <div className={`mt-6 overflow-hidden rounded-2xl bg-black ${tall ? "mx-auto aspect-[9/16] max-w-sm" : "aspect-video"}`}>
          <iframe
            src={v.embedUrl!}
            title={v.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        {v.description && <p className="mt-6 max-w-3xl whitespace-pre-line text-foreground/80">{v.description}</p>}
        <p className="mt-6">
          <a href={v.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-brand-primary-text">
            Watch on {v.platform === "tiktok" ? "TikTok" : "YouTube"}
          </a>
        </p>
        <div className="mt-8">
          <p className="text-sm font-semibold">Follow {FOUNDER.name}</p>
          <SocialLinks className="mt-3" />
        </div>
      </Container>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getPublicProject } from "@/db/projects";
import { parseVideoLink } from "@/lib/video";
import { branchLabel } from "@/config/branches";
import { SharePage } from "@/components/ui/SharePage";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary || undefined,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: project.cover?.kind === "image" ? { images: [project.cover.url] } : undefined,
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) notFound();

  const paragraphs = project.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const images = project.media.filter((item) => item.kind === "image");
  const videos = project.media
    .filter((item) => item.kind === "video_link")
    .map((item) => ({ item, video: parseVideoLink(item.url) }))
    .filter((entry) => entry.video !== null);

  return (
    <article className="py-16">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
          {project.branches.filter((b) => b !== "home").map(branchLabel).join(" · ") || "Project"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
        {project.summary && <p className="mt-4 max-w-2xl text-lg leading-8 text-foreground/70">{project.summary}</p>}

        {project.cover?.kind === "image" && (
          <Image
            src={project.cover.url}
            alt={project.cover.altText}
            width={project.cover.width ?? 1600}
            height={project.cover.height ?? 1000}
            sizes="(min-width: 1152px) 1152px, 100vw"
            priority
            className="mt-10 w-full rounded-2xl object-cover"
          />
        )}

        {paragraphs.length > 0 && (
          <div className="mt-10 flex max-w-2xl flex-col gap-4 text-base leading-7 text-foreground/80">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {videos.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {videos.map(({ item, video }) =>
              video!.platform === "youtube" ? (
                <figure key={item.id}>
                  <iframe
                    src={video!.embedUrl}
                    title={item.caption || project.title}
                    loading="lazy"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full rounded-2xl"
                  />
                  {item.caption && <figcaption className="mt-2 text-sm text-foreground/60">{item.caption}</figcaption>}
                </figure>
              ) : (
                <a
                  key={item.id}
                  href={video!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-video items-center justify-center rounded-2xl border border-black/10 text-sm font-medium hover:border-brand-primary-text dark:border-white/10"
                >
                  {item.caption || "Watch on TikTok"} ↗
                </a>
              ),
            )}
          </div>
        )}

        {images.length > 1 && (
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
            {images
              .filter((image) => image.id !== project.cover?.id)
              .map((image) => (
                <figure key={image.id}>
                  <Image
                    src={image.url}
                    alt={image.altText}
                    width={600}
                    height={450}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                  {image.caption && <figcaption className="mt-1 text-xs text-foreground/60">{image.caption}</figcaption>}
                </figure>
              ))}
          </div>
        )}

        <div className="mt-12">
          <Button href="/projects" variant="outline">
            All projects
          </Button>
        </div>
      </Container>
      <SharePage
        path={`/projects/${project.slug}`}
        title={project.title}
        message={`🛠️ *${project.title}*${project.summary ? `\n\n${project.summary}` : ""}\n\nSee it on ZIVARUKAH 👇`}
        heading="📣 Share this project"
      />
    </article>
  );
}

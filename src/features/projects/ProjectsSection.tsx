import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicProjects } from "@/db/projects";
import type { BranchId } from "@/config/branches";

interface ProjectsSectionProps {
  /** Only projects tagged for this division; omit for all published projects. */
  branch?: BranchId;
  eyebrow?: string;
  title?: string;
  limit?: number;
}

/** Renders nothing at all until the admin publishes a matching project. */
export async function ProjectsSection({
  branch,
  eyebrow = "Projects",
  title = "Latest projects",
  limit = 6,
}: ProjectsSectionProps) {
  const projects = await getPublicProjects(branch, limit);
  if (projects.length === 0) return null;

  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-colors hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900"
            >
              {project.cover?.kind === "image" ? (
                <Image
                  src={project.cover.url}
                  alt={project.cover.altText}
                  width={600}
                  height={400}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="aspect-[3/2] w-full object-cover"
                />
              ) : (
                <div className="aspect-[3/2] w-full bg-black/5 dark:bg-white/5" />
              )}
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-base font-semibold text-foreground group-hover:text-brand-primary-text">
                  {project.title}
                </h3>
                {project.summary && <p className="text-sm leading-6 text-foreground/70">{project.summary}</p>}
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

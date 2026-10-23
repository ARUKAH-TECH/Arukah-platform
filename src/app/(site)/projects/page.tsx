import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { projectsPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

export const metadata: Metadata = {
  title: "Projects",
  description: "School, church and other management systems and software projects built by ARUKAH TECH in Ghana.",
  alternates: { canonical: "/projects" },
};

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export default async function ProjectsPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(projectsPage));
  const projects = [1, 2].map((n) => ({
    name: t.text(`card${n}Name`),
    description: t.text(`card${n}Text`),
  }));

  return (
    <>
      {/* Projects published from the admin dashboard; renders nothing until one exists. */}
      <ProjectsSection eyebrow="Projects" title={t.text("latestTitle")} limit={24} />
      <div className="py-16" data-brand="tech">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Featured Projects"
            title={t.text("systemsTitle")}
            description={t.text("systemsText")}
          />

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.name}
                className="flex flex-col gap-3 rounded-2xl border border-dashed border-black/15 p-6 dark:border-white/15"
              >
                <div className="flex aspect-video items-center justify-center rounded-xl bg-black/5 text-xs text-foreground/50 dark:bg-white/5">
                  Preview coming soon
                </div>
                <h3 className="text-sm font-semibold">{project.name}</h3>
                <p className="text-sm text-foreground/70">{project.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button href="/tech" variant="outline">
              More about ARUKAH TECH
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
}

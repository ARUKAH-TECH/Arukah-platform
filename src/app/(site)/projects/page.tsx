import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { CompletedWork } from "@/features/portfolio/CompletedWork";
import { whatsappLink } from "@/config/forms";
import { projectsPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

export const metadata: Metadata = {
  title: "Projects",
  description: "School, church and other management systems and software projects built by ARUKAH TECH in Ghana.",
  alternates: { canonical: "/projects" },
  openGraph: { title: "Projects | ZIVARUKAH", description: "School, church and other management systems and software projects built by ARUKAH TECH in Ghana." },
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
            eyebrow="ARUKAH TECH"
            title={t.text("systemsTitle")}
            description={t.text("systemsText")}
          />

          <div className="mt-10">
            <CompletedWork />
          </div>

          <h2 className="mt-14 text-center text-xl font-semibold tracking-tight">Systems we build</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <div key={project.name} className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <h3 className="font-semibold">{project.name}</h3>
                <p className="text-sm leading-6 text-foreground/70">{project.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href={whatsappLink("Hello ARUKAH TECH, I would like a system / website for ")}>Discuss a project</Button>
            <Button href="/tech" variant="outline">
              More about ARUKAH TECH
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
}

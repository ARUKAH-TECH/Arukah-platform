import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Projects",
  description: "Management systems and software projects from ARUKAH TECH.",
};

const projects = [
  {
    name: "School Management System",
    description: "Enrollment, attendance, grading, and communication tools for schools.",
  },
  {
    name: "Church Management System",
    description: "Membership records, giving, and event coordination for churches.",
  },
  {
    name: "Fuel Station Management System",
    description: "Sales, inventory, and loss-control tracking for fuel stations.",
  },
];

export default function ProjectsPage() {
  return (
    <div className="py-16" data-brand="tech">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Featured Projects"
          title="Systems ARUKAH TECH builds"
          description="These are the kinds of management systems in active development. Screenshots and case studies are added here as projects are completed — none are presented as finished work for a named client until that's confirmed."
        />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
  );
}

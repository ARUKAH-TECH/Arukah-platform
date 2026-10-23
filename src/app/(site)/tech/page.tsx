import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { techPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "TECH",
  description: "Custom software, websites, and management systems from ARUKAH TECH.",
  alternates: { canonical: "/tech" },
};

export default async function TechPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(techPage));
  const serviceGroups = [1, 2, 3].map((n) => ({
    title: t.text(`group${n}Title`),
    items: t.list(`group${n}Items`),
  }));

  return (
    <div data-brand="tech">
      <AnnouncementBar branch="tech" />
      <Hero
        logo={brands.tech.logo}
        title="ARUKAH TECH"
        tagline={t.text("heroTagline")}
        primaryCta={{ label: "Discuss a project", href: "/contact" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we build" title={t.text("servicesTitle")} align="center" />
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {serviceGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-primary-text">
                  {group.title}
                </h3>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/70">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="rounded-3xl border border-black/10 bg-black/5 p-10 text-center dark:border-white/10 dark:bg-white/5">
            <SectionHeading
              align="center"
              eyebrow="Featured projects"
              title={t.text("projectsTitle")}
              description={t.text("projectsText")}
            />
            <Link
              href="/#projects"
              className="mt-6 inline-block text-sm font-medium text-brand-primary-text hover:underline"
            >
              See project previews on the homepage →
            </Link>
          </div>
        </Container>
      </section>

      <ProjectsSection branch="tech" />
    </div>
  );
}

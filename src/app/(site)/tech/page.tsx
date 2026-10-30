import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { GallerySection } from "@/features/gallery/GallerySection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { techPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { SharePage } from "@/components/ui/SharePage";
import { CompletedWork } from "@/features/portfolio/CompletedWork";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ARUKAH TECH: Software, Websites & Management Systems in Ghana",
  description:
    "ARUKAH TECH builds websites, custom software and school, church, hospital and fuel station management systems in Ghana, with deployment, maintenance and technical support.",
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
      <AdBanner branch="tech" />
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

      <section id="work" className="py-16">
        <Container>
          <SectionHeading align="center" eyebrow="Our work" title={t.text("projectsTitle")} description={t.text("projectsText")} />
          <div className="mt-10">
            <CompletedWork />
          </div>
          <p className="mt-8 text-center text-sm text-foreground/70">
            Need a website or a management system for your church, school or business?{" "}
            <Link href="/contact" className="font-semibold text-brand-primary-text underline">
              Let&apos;s talk
            </Link>
          </p>
        </Container>
      </section>

      <AdSlot branch="tech" />


      <GallerySection branch="tech" />
      <ProjectsSection branch="tech" />
      <SharePage
        path="/tech"
        title="ARUKAH TECH"
        message={"💻 *ARUKAH TECH*\n\nWebsites, apps and management systems for schools, churches and businesses 👇"}
        heading="📣 Share ARUKAH TECH"
      />
    </div>
  );
}

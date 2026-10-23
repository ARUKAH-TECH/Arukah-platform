import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { mediaPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "MEDIA",
  description: "Video production, event coverage, and creative media from ARUKAH MEDIA.",
  alternates: { canonical: "/media" },
};

export default async function MediaPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(mediaPage));

  return (
    <div>
      <AnnouncementBar branch="media" />
      <Hero
        logo={brands.arukah.logo}
        title="ARUKAH MEDIA"
        tagline={t.text("heroTagline")}
        primaryCta={{ label: "Discuss a video project", href: "/contact" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we offer" title={t.text("servicesTitle")} align="center" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {t.list("services").map((service) => (
              <div
                key={service}
                className="rounded-xl border border-black/10 p-4 text-center text-sm font-medium dark:border-white/10"
              >
                {service}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <AdSlot branch="media" />


      <ProjectsSection branch="media" />
    </div>
  );
}

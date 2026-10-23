import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { zivaPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ZIVA Special Classes",
  description: "Special classes from Primary 1 to SHS 3. Excellence our hallmark.",
  alternates: { canonical: "/ziva" },
};

export default async function ZivaPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(zivaPage));

  return (
    <div data-brand="ziva">
      <AnnouncementBar branch="ziva" />
      <Hero
        logo={brands.ziva.logo}
        title="ZIVA Special Classes"
        tagline={t.text("heroTagline")}
        primaryCta={{ label: "Enquire about ZIVA", href: "/contact" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading
            eyebrow="On the way"
            title={t.text("upcomingTitle")}
            align="center"
            description={t.text("upcomingText")}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {t.list("upcomingItems").map((item) => (
              <div
                key={item}
                className="rounded-xl border border-dashed border-black/15 p-4 text-center text-sm font-medium text-foreground/70 dark:border-white/15"
              >
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <AdSlot branch="ziva" />


      <ProjectsSection branch="ziva" />
    </div>
  );
}

import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";

export const metadata: Metadata = {
  title: "ARUKAH MEDIA",
  description: "Video production, event coverage, and creative media from ARUKAH MEDIA.",
};

const services = ["Video production", "Event coverage", "Video editing", "Promotional videos"];

export default function MediaPage() {
  return (
    <div>
      <Hero
        logo={brands.arukah.logo}
        title="ARUKAH MEDIA"
        tagline="Creative media, done well. No dedicated logo has been supplied yet, so ARUKAH MEDIA uses the master ARUKAH identity for now."
        primaryCta={{ label: "Discuss a video project", href: "/#contact" }}
        secondaryCta={{ label: "Back to ARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we offer" title="Services" align="center" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {services.map((service) => (
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
    </div>
  );
}

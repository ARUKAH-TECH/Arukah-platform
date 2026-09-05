import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";

export const metadata: Metadata = {
  title: "ARUKAH TECH",
  description: "Custom software, websites, and management systems from ARUKAH TECH.",
};

const serviceGroups = [
  {
    title: "Management systems",
    items: [
      "School management systems",
      "Church management systems",
      "Fuel station management systems",
      "Hospital management systems",
      "Organization management systems",
    ],
  },
  {
    title: "Software & web",
    items: ["Website development", "Custom software"],
  },
  {
    title: "Deployment & support",
    items: ["System deployment", "System management", "Maintenance", "Technical support"],
  },
];

export default function TechPage() {
  return (
    <div data-brand="tech">
      <Hero
        logo={brands.tech.logo}
        title="ARUKAH TECH"
        tagline="Innovate. Develop. Empower. Custom software and management systems built for organizations that need reliable, well-maintained technology."
        primaryCta={{ label: "Discuss a project", href: "/contact" }}
        secondaryCta={{ label: "Back to ARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we build" title="Services" align="center" />
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {serviceGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
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
              title="Systems in development"
              description="School, church, and fuel station management systems are in active development. Case studies and screenshots are added here as projects are completed."
            />
            <Link
              href="/#projects"
              className="mt-6 inline-block text-sm font-medium text-brand-primary hover:underline"
            >
              See project previews on the homepage →
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

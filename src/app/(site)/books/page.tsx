import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ZIVARUKAH BOOKS",
  description: "Online reading, digital downloads, and printed books from ZIVARUKAH BOOKS. Coming soon.",
  alternates: { canonical: "/books" },
};

const upcoming = [
  "Read online",
  "Digital downloads",
  "Printed copies",
  "Read-aloud support",
];

export default function BooksPage() {
  return (
    <div>
      <Hero
        logo={brands.arukah.logo}
        title="ZIVARUKAH BOOKS"
        tagline="An online bookstore is on the way. No books are on sale yet — get in touch if you'd like to hear when it opens."
        primaryCta={{ label: "Get notified", href: "/contact" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading
            eyebrow="On the way"
            title="What the bookstore will offer"
            align="center"
            description="A future phase of this platform adds the bookstore itself. Until then, nothing here can be purchased."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {upcoming.map((item) => (
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

      <ProjectsSection branch="books" />
    </div>
  );
}

import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";

export const metadata: Metadata = {
  title: "ZIVA Special Classes",
  description: "Special classes from Primary 1 to SHS 3. Excellence our hallmark.",
};

const upcoming = [
  "Student enrollment",
  "Teacher management",
  "Attendance tracking",
  "Subjects & timetables",
  "Fees",
  "Performance reports",
  "Parent communication",
];

export default function ZivaPage() {
  return (
    <div data-brand="ziva">
      <Hero
        logo={brands.ziva.logo}
        title="ZIVA Special Classes"
        tagline="Excellence our hallmark. Special classes for students from Primary 1 to SHS 3, focused on genuine academic growth."
        primaryCta={{ label: "Enquire about ZIVA", href: "/contact" }}
        secondaryCta={{ label: "Back to ARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading
            eyebrow="On the way"
            title="A dedicated ZIVA platform is coming"
            align="center"
            description="A future phase of this platform will add online tools for enrollment, teachers, attendance, fees, and parent communication. For now, get in touch to enquire about classes."
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
    </div>
  );
}

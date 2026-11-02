import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPublicProgrammes } from "@/db/programmes";
import { ProgrammeCard } from "@/features/programmes/ProgrammeCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Online Programmes: Classes and Events",
  description: "Online classes, trainings and events by ZIVARUKAH on Zoom, Google Meet and Teams. Register on the website and receive your secret access code.",
  alternates: { canonical: "/programmes" },
};

export default async function ProgrammesPage() {
  const all = await getPublicProgrammes();
  const now = Date.now();
  const upcoming = all.filter((p) => (p.status === "published" || p.status === "closed") && Date.parse(p.endsAt) > now);
  const past = all
    .filter((p) => !upcoming.includes(p))
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
    .slice(0, 12);

  return (
    <section className="py-14">
      <Container>
        <SectionHeading
          eyebrow="Online programmes"
          title="Learn with us online"
          description="Classes, trainings and events held online. Register here, keep your secret code, and use it to open the joining details."
        />
        <Link
          href="/programmes/access"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0b3d91] px-5 py-3 text-sm font-bold text-white"
        >
          🔑 I have a code
        </Link>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-brand-primary-text">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-foreground/70">No programmes are open right now. Please check back soon.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {upcoming.map((p) => (
              <ProgrammeCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-foreground/60">Past programmes</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 opacity-80 md:grid-cols-2">
              {past.map((p) => (
                <ProgrammeCard key={p.id} p={p} />
              ))}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}

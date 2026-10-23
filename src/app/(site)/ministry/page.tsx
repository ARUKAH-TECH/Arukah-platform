import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { Button } from "@/components/ui/Button";
import { MinistryForm } from "@/features/ministry/MinistryForm";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { OutreachSection } from "@/features/outreach/OutreachSection";
import { ministryPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Repent Online Ministries — Rescue the Perishing",
  description:
    "Repent Online Ministries: Christian teaching, sermons, prayer and hospital, prison, street and community outreach. New here or growing in faith? Reach out.",
  alternates: { canonical: "/ministry" },
};

export default async function MinistryPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(ministryPage));

  return (
    <div data-brand="ministry" className="bg-black text-white">
      <AnnouncementBar branch="ministry" />
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
              Online Ministry
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Repent Online Ministries
            </h1>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-brand-secondary">
              {t.text("motto")}
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{t.text("intro")}</p>
            <div className="mt-4">
              <SocialLinks />
            </div>
            <div className="mt-6">
              <Button href="#respond">Get in touch</Button>
            </div>
          </div>
          <Image
            src={brands.ministry.logo.src}
            alt="Repent Online Ministries logo"
            width={260}
            height={(260 * brands.ministry.logo.height) / brands.ministry.logo.width}
            className="mx-auto"
          />
        </div>

        <div className="border-t border-white/10 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            Coming soon
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.text("upcomingTitle")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {t.list("upcomingItems").map((item) => (
              <div
                key={item}
                className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/70"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div id="respond" className="border-t border-white/10 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            {t.text("respondEyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.text("respondTitle")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">{t.text("respondText")}</p>
          <div className="mt-8 max-w-xl">
            <MinistryForm dark />
          </div>
        </div>
      </Container>

      <OutreachSection />

      <ProjectsSection branch="ministry" eyebrow="Outreach" title="Recent outreach" dark />
    </div>
  );
}

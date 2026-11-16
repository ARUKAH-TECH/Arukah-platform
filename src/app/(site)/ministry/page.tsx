import type { Metadata } from "next";
import { ProgrammesSection } from "@/features/programmes/ProgrammesSection";
import { PastProgrammes } from "@/features/programmes/PastProgrammes";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { Button } from "@/components/ui/Button";
import { MinistryForm } from "@/features/ministry/MinistryForm";
import { WhatsAppContact } from "@/components/ui/WhatsAppContact";
import { ONLINE_FORMS_ENABLED } from "@/config/forms";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { OutreachSection } from "@/features/outreach/OutreachSection";
import { ministryPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { SharePage } from "@/components/ui/SharePage";
import { verseOfTheDay } from "@/server/bible";
import { shareCardHref } from "@/lib/bible";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Repent Online Ministries: Rescue the Perishing",
  description:
    "Repent Online Ministries: Christian teaching, sermons, prayer and hospital, prison, street and community outreach. New here or growing in faith? Reach out.",
  alternates: { canonical: "/ministry" },
  openGraph: { title: "Repent Online Ministries: Rescue the Perishing | ZIVARUKAH", description: "Repent Online Ministries: Christian teaching, sermons, prayer and hospital, prison, street and community outreach. New here or growing in faith? Reach out." },
};

export default async function MinistryPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(ministryPage));
  const verse = await verseOfTheDay();

  return (
    <div data-brand="ministry" className="bg-black text-white">
      <AnnouncementBar branch="ministry" />
      <ProgrammesSection branch="ministry" dark />
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
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/bible">📖 Bible, devotionals &amp; studies</Button>
              <Button href="/ministry/support">🙏 Support the outreach</Button>
              <Button href="/videos" variant="secondary">▶ Watch our videos</Button>
              <Button href="#respond" variant="outline">Get in touch</Button>
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

        <div id="what-we-do" className="border-t border-white/10 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">What we do</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Ministry work, online and in the community</h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "📖", title: "R.O.M Bible Guide", text: "Read and listen to the Bible free, compare versions and search any verse.", href: "/bible" },
              { icon: "🌅", title: "Daily devotionals", text: "A short devotional every morning, with daily alerts on your phone.", href: "/bible/devotionals" },
              { icon: "▶", title: "Videos and messages", text: "Preaching and teaching from our YouTube, TikTok and Facebook pages.", href: "/videos" },
              { icon: "🤝", title: "Outreach", text: "Hospital, prison, street and community outreach to people in need.", href: "/ministry/outreach" },
              { icon: "🗓️", title: "Online programmes", text: "Ministry programmes and trainings on Zoom and Google Meet.", href: "/programmes" },
              { icon: "✍️", title: "Articles", text: "Faith and spiritual growth articles, such as how to read the Bible daily.", href: "/articles" },
            ].map((item) => (
              <li key={item.title}>
                <a href={item.href} className="block h-full rounded-2xl border border-white/15 p-5 hover:border-brand-primary">
                  <p className="text-2xl" aria-hidden="true">
                    {item.icon}
                  </p>
                  <h3 className="mt-2 font-bold">{item.title} →</h3>
                  <p className="mt-1 text-sm leading-6 text-white/70">{item.text}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div id="respond" className="border-t border-white/10 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            {t.text("respondEyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t.text("respondTitle")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">{t.text("respondText")}</p>
          <div className="mt-8 max-w-xl">
            {ONLINE_FORMS_ENABLED ? (
              <MinistryForm dark />
            ) : (
              <WhatsAppContact
                dark
                message="Hello Repent Online Ministries, "
                label="Talk to the ministry on WhatsApp"
                note="For prayer, counselling or to give your life to Christ, message us on WhatsApp. Your conversation stays between you and the ministry."
              />
            )}
          </div>
        </div>
      </Container>

      <OutreachSection />

      <PastProgrammes branch="ministry" dark />
      <ProjectsSection branch="ministry" eyebrow="Outreach" title="Recent outreach" dark />
      <SharePage
        image={verse ? shareCardHref(verse.ref) : undefined}
        path="/ministry"
        title="Repent Online Ministries"
        message={"✝️ *Repent Online Ministries*\n\nHospital, prison, street and community outreach, and the Word online. Follow, pray with us and support the work 👇"}
        heading="🙏 Share the ministry"
        note="Invite someone to follow, pray and support the outreach."
        dark
      />
    </div>
  );
}

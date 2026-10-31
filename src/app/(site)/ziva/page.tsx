import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { GallerySection } from "@/features/gallery/GallerySection";
import { LiteracyPromo } from "@/features/literacy/LiteracyPromo";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { zivaPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { SharePage } from "@/components/ui/SharePage";
import { whatsappLink } from "@/config/forms";
import { NursingClass } from "@/features/ziva/NursingClass";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ZIVA Online and Special Classes: Admissions Open, Primary 1 to JHS",
  description:
    "Admissions open at ZIVA Online and Special Classes by ZIVARUKAH: special teaching in Maths, Science, English, Creative Arts, Career Technology and R.M.E for Primary 1 to JHS, by home service or online. Plus a free Saturday Zoom class for nursing students.",
  alternates: { canonical: "/ziva" },
};

export default async function ZivaPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(zivaPage));

  return (
    <div data-brand="ziva">
      <AnnouncementBar branch="ziva" />
      <AdBanner branch="ziva" />
      <Hero
        logo={brands.ziva.logo}
        title="ZIVA Special Classes"
        tagline={t.text("heroTagline")}
        primaryCta={{ label: "Apply for admission", href: "#admissions" }}
        secondaryCta={{ label: "🩺 Free nursing class", href: "#nursing" }}
      />

      <section id="admissions" className="scroll-mt-20 py-16">
        <Container>
          <div className="mx-auto max-w-4xl rounded-3xl border-2 border-brand-primary bg-white p-6 shadow-md sm:p-10 dark:bg-white/5">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-900">
              <span aria-hidden="true">🎓</span> {t.text("admissionsBadge")}
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{t.text("admissionsTitle")}</h2>
            <p className="mt-3 leading-7 text-foreground/80">{t.text("admissionsText")}</p>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-brand-primary-text">Subjects</h3>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {t.list("subjects").map((subject) => (
                <li key={subject} className="flex items-center gap-2 rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold dark:border-white/10">
                  <span aria-hidden="true" className="text-brand-primary-text">✓</span>
                  {subject}
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-brand-primary-text">How we teach</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-black/5 p-5 dark:bg-white/10">
                <p className="text-lg font-bold">🏠 {t.text("homeTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-foreground/80">{t.text("homeText")}</p>
              </div>
              <div className="rounded-2xl bg-black/5 p-5 dark:bg-white/10">
                <p className="text-lg font-bold">💻 {t.text("onlineTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-foreground/80">{t.text("onlineText")}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/70">Primary 1 to JHS 3 · home or online, depending on your location.</p>

            <div className="mt-8 rounded-2xl bg-amber-50 p-5 dark:bg-white/10">
              <p className="text-sm leading-6 text-foreground/80">{t.text("applyText")}</p>
              <a
                href={whatsappLink(
                  "Hello ZIVA Online and Special Classes, I would like to apply for admission.\n\nLearner's class (P1 to JHS 3): \nSubjects: \nHome or online: \nTown / area: ",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-black hover:opacity-90"
              >
                🎓 Apply now on WhatsApp
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section id="nursing" className="scroll-mt-20 pb-16">
        <Container>
          <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-sky-50 to-emerald-50 p-6 shadow-md sm:p-10 dark:from-white/5 dark:to-white/5">
            <p className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-900">
              <span aria-hidden="true">🩺</span> Nursing students only · Free
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Free online class for nursing students</h2>
            <p className="mt-3 leading-7 text-foreground/80">
              Are you a nursing or midwifery student who needs help with a subject? Join our free Saturday class on Zoom.
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <li className="rounded-xl bg-white p-4 shadow-sm dark:bg-white/10">
                <span className="block text-xs font-semibold uppercase text-foreground/60">When</span>
                <span className="font-bold">Every Saturday, 3:00pm to 4:00pm</span>
              </li>
              <li className="rounded-xl bg-white p-4 shadow-sm dark:bg-white/10">
                <span className="block text-xs font-semibold uppercase text-foreground/60">Where</span>
                <span className="font-bold">Online on Zoom</span>
              </li>
              <li className="rounded-xl bg-white p-4 shadow-sm dark:bg-white/10">
                <span className="block text-xs font-semibold uppercase text-foreground/60">Cost</span>
                <span className="font-bold">Free for now</span>
              </li>
            </ul>
            <p className="mt-4 text-sm leading-6 text-foreground/80">
              The Zoom link and any time changes are shared in our WhatsApp group. Tell us your school, course and the subject you need help with, then join the group.
            </p>
            <NursingClass />
          </div>
        </Container>
      </section>

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


      <LiteracyPromo />
      <GallerySection branch="ziva" />
      <ProjectsSection branch="ziva" />
      <SharePage
        path="/ziva"
        title="ZIVA Special Classes"
        message={"🎓 *ZIVA Online and Special Classes: admissions open!*\n\nSpecial teaching in Maths, Science, English, Creative Arts, Career Technology and R.M.E for Primary 1 to JHS. Home service or online, depending on your location. Apply here 👇"}
        heading="📣 Share ZIVA Special Classes"
        note="Know a parent or teacher who would like this?"
      />
    </div>
  );
}

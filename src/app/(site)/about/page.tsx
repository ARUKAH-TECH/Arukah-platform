import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { SharePage } from "@/components/ui/SharePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { brands } from "@/config/brands";
import { businessNav } from "@/config/nav";
import { FOUNDER, ORG_DESCRIPTION, founderLd } from "@/config/founder";
import { aboutPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

const SITE = (process.env.SITE_URL || "https://zivarukah.com").replace(/\/$/, "");

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "What ZIVARUKAH Means · Founder Shepherd Justice Sarpong Oduro" },
  description:
    "ZIVARUKAH joins two Hebrew words: ZIVA (light of God) and ARUKAH (total restoration). Founded and led by Shepherd Justice Sarpong Oduro — minister, teacher and author in Ghana.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About ZIVARUKAH — God's light. Total restoration.",
    description: "The meaning of ZIVARUKAH and the story of its founder, Shepherd Justice Sarpong Oduro.",
    url: "/about",
    type: "profile",
    images: [{ url: FOUNDER.photo.src, width: FOUNDER.photo.width, height: FOUNDER.photo.height, alt: FOUNDER.name }],
  },
};

export default async function AboutPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(aboutPage));
  const logo = brands.arukah.logo;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "AboutPage",
              "@id": `${SITE}/about#page`,
              url: `${SITE}/about`,
              name: "About ZIVARUKAH",
              about: { "@id": `${SITE}/#organization` },
              mainEntity: { "@id": `${SITE}/#founder` },
              inLanguage: "en-GH",
            },
            {
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "ZIVARUKAH",
              legalName: "ZIVARUKAH VENTURES",
              url: SITE,
              logo: `${SITE}${logo.src}`,
              description: ORG_DESCRIPTION,
              slogan: t.text("motto") || "God's light. Total restoration.",
              founder: { "@id": `${SITE}/#founder` },
              areaServed: "GH",
            },
            founderLd(SITE),
          ],
        }}
      />

      {/* ── the name ── */}
      <section className="py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Image src={logo.src} alt="ZIVARUKAH logo" width={180} height={(180 * logo.height) / logo.width} className="mx-auto" priority />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-primary-text">About ZIVARUKAH</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.text("nameTitle")}</h1>
            <p className="mt-3 text-lg font-semibold text-brand-primary-text">{t.text("motto")}</p>
            <p className="mt-4 text-base leading-7 text-foreground/75">{t.text("nameIntro")}</p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-3xl font-black tracking-tight">ZIVA</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-primary-text">Light · the light of God</p>
              <p className="mt-3 leading-7 text-foreground/75">{t.text("zivaText")}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-3xl font-black tracking-tight">ARUKAH</p>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-primary-text">Healing · total restoration</p>
              <p className="mt-3 leading-7 text-foreground/75">{t.text("arukahText")}</p>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-8">{t.text("togetherText")}</p>
        </Container>
      </section>

      {/* ── the founder ── */}
      <section id="founder" className="border-t border-black/10 py-16 dark:border-white/10">
        <Container>
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
            <figure className="mx-auto w-full max-w-sm">
              <Image
                src={FOUNDER.photo.src}
                alt={`${FOUNDER.name}, founder of ZIVARUKAH`}
                width={FOUNDER.photo.width}
                height={FOUNDER.photo.height}
                sizes="(min-width: 1024px) 360px, 90vw"
                className="w-full rounded-2xl bg-white shadow-md"
              />
              <figcaption className="mt-3 text-center">
                <span className="block text-lg font-bold">{FOUNDER.name}</span>
                <span className="block text-sm text-foreground/70">{FOUNDER.title}</span>
              </figcaption>
            </figure>

            <div>
              <SectionHeading eyebrow="Founder" title={t.text("founderTitle")} />
              <div className="mt-6 flex flex-col gap-4 text-base leading-7 text-foreground/80">
                {t.list("founderStory").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-6">
                <SocialLinks />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/books">Read his books</Button>
                <Button href="/ministry" variant="outline">
                  Repent Online Ministries
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── the branches ── */}
      <section className="border-t border-black/10 py-16 dark:border-white/10">
        <Container>
          <SectionHeading eyebrow="One brand" title="Light and restoration, in every branch" align="center" />
          <ul className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
            {[...businessNav, { label: "Repent Online Ministries", href: "/ministry" }].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block rounded-xl border border-black/10 p-4 font-semibold hover:border-brand-primary dark:border-white/10">
                  {link.label} →
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <SharePage
        path="/about"
        title="About ZIVARUKAH"
        message={"✨ *ZIVARUKAH* — God's light. Total restoration.\n\nWhat the name means, and the story of Shepherd Justice Sarpong Oduro 👇"}
        heading="Share our story"
        note="Tell someone what ZIVARUKAH means."
      />
    </>
  );
}

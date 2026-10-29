import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { Button } from "@/components/ui/Button";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { GallerySection } from "@/features/gallery/GallerySection";
import { LiteracyPromo } from "@/features/literacy/LiteracyPromo";
import { WhatsNew } from "@/features/whatsnew/WhatsNew";
import { QuoteOfTheDay } from "@/features/quote/QuoteOfTheDay";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { socialLinks } from "@/config/social";
import { homePage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { SharePage } from "@/components/ui/SharePage";

const SITE = process.env.SITE_URL || "https://zivarukah.com";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export default async function Home() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(homePage));
  const whyArukah = [1, 2, 3, 4].map((n) => ({
    title: t.text(`why${n}Title`),
    description: t.text(`why${n}Text`),
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "ZIVARUKAH",
              legalName: "ZIVARUKAH VENTURES",
              url: SITE,
              logo: `${SITE}${brands.arukah.logo.src}`,
              slogan: "Creating Solutions. Building Skills. Serving Communities.",
              areaServed: "GH",
              // Only real profile pages (search-result links are left out).
              sameAs: socialLinks.map((link) => link.href).filter((href) => !href.includes("/search/") && !href.includes("wa.me")),
              department: [
                { "@type": "Organization", name: "ARUKAH TECH", url: `${SITE}/tech` },
                { "@type": "Organization", name: "ARUKAH WEAR", url: `${SITE}/footwear` },
                { "@type": "EducationalOrganization", name: "ZIVA Special Classes", url: `${SITE}/ziva` },
                { "@type": "Organization", name: "ARUKAH MEDIA", url: `${SITE}/media` },
                { "@type": "Organization", name: "ZIVARUKAH BOOKS", url: `${SITE}/books` },
              ],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE}/#website`,
              name: "ZIVARUKAH",
              url: SITE,
              publisher: { "@id": `${SITE}/#organization` },
              inLanguage: "en-GH",
            },
          ],
        }}
      />
      <AnnouncementBar branch="home" />
      <AdBanner branch="home" />
      <Hero
        logo={brands.arukah.logo}
        title="ZIVARUKAH"
        tagline={t.text("heroTagline")}
        supportingLine={t.text("heroSupportingLine")}
        primaryCta={{ label: "Explore ZIVARUKAH", href: "#businesses" }}
        secondaryCta={{ label: "Contact Us", href: "/contact" }}
      />

      <WhatsNew />
      <QuoteOfTheDay />

      <section id="about" className="py-16">
        <Container>
          <SectionHeading
            eyebrow="About"
            title={t.text("aboutTitle")}
            description={t.text("aboutText")}
          />
        </Container>
      </section>

      <section id="businesses" className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Businesses" title={t.text("businessesTitle")} align="center" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <BusinessCard
              brand="tech"
              name="ARUKAH TECH"
              description={t.text("techCard")}
              href="/tech"
              logo={brands.tech.logo}
            />
            <BusinessCard
              brand="footwear"
              name="ARUKAH WEAR"
              description={t.text("wearCard")}
              href="/footwear"
              logo={brands.footwear.logo}
            />
            <BusinessCard
              brand="ziva"
              name="ZIVA Special Classes"
              description={t.text("zivaCard")}
              href="/ziva"
              logo={brands.ziva.logo}
            />
            <BusinessCard
              brand="media"
              name="ARUKAH MEDIA"
              description={t.text("mediaCard")}
              href="/media"
              logo={brands.arukah.logo}
            />
            <BusinessCard
              brand="books"
              name="ZIVARUKAH BOOKS"
              description={t.text("booksCard")}
              href="/books"
              logo={brands.arukah.logo}
            />
          </div>
        </Container>
      </section>

      <section id="tech" data-brand="tech" className="py-16">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="ARUKAH TECH"
                title={t.text("techTitle")}
                description={t.text("techText")}
              />
              <ul className="mt-6 flex flex-col gap-2 text-sm text-foreground/70">
                {t.list("techServices").map((service) => (
                  <li key={service} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                    {service}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button href="/tech">More about ARUKAH TECH</Button>
                <Button href="/contact" variant="outline">
                  Discuss a project
                </Button>
              </div>
            </div>
            <Image
              src={brands.tech.logo.src}
              alt="ARUKAH TECH logo"
              width={320}
              height={320}
              className="mx-auto"
            />
          </div>
        </Container>
      </section>

      <section id="projects" className="py-16">
        <Container>
          <SectionHeading
            eyebrow="Featured Projects"
            title={t.text("projectsTitle")}
            description={t.text("projectsText")}
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {["School Management System", "Church Management System"].map(
              (project) => (
                <div
                  key={project}
                  className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 p-6 text-center dark:border-white/15"
                >
                  <p className="text-sm font-medium">{project}</p>
                  <p className="mt-1 text-xs text-foreground/60">Preview coming soon</p>
                </div>
              ),
            )}
          </div>
          <div className="mt-8 text-center">
            <Button href="/projects" variant="outline">
              View all projects
            </Button>
          </div>
        </Container>
      </section>

      <AdSlot branch="home" />


      <LiteracyPromo />
      <GallerySection branch="home" />
      <ProjectsSection branch="home" eyebrow="Latest" title="Recent projects" />

      <section id="footwear" data-brand="footwear" className="py-16">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <Image
              src={brands.footwear.logo.src}
              alt="ARUKAH WEAR logo"
              width={320}
              height={320}
              className="order-2 mx-auto rounded-2xl bg-white lg:order-1"
            />
            <div className="order-1 lg:order-2">
              <SectionHeading
                eyebrow="ARUKAH WEAR"
                title={t.text("wearTitle")}
                description={t.text("wearText")}
              />
              <ul className="mt-6 flex flex-col gap-2 text-sm text-foreground/70">
                {t.list("wearHighlights").map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-foreground/60">{t.text("wearNote")}</p>
              <div className="mt-6">
                <Button href="/footwear">See ARUKAH WEAR</Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="ziva" data-brand="ziva" className="py-16">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="ZIVA Special Classes"
                title={t.text("zivaTitle")}
                description={t.text("zivaText")}
              />
              <div className="mt-6 flex flex-wrap gap-4">
                <Button href="/ziva">More about ZIVA classes</Button>
                <Button href="/contact" variant="outline">
                  Enquire about ZIVA
                </Button>
              </div>
            </div>
            <Image
              src={brands.ziva.logo.src}
              alt="ZIVA Special Classes logo"
              width={220}
              height={(220 * brands.ziva.logo.height) / brands.ziva.logo.width}
              className="mx-auto rounded-2xl"
            />
          </div>
        </Container>
      </section>

      <section id="media" className="py-16">
        <Container>
          <SectionHeading eyebrow="ARUKAH MEDIA" title={t.text("mediaTitle")} align="center" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {t.list("mediaServices").map((service) => (
              <div
                key={service}
                className="rounded-xl border border-black/10 p-4 text-center text-sm font-medium dark:border-white/10"
              >
                {service}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button href="/media">More about ARUKAH MEDIA</Button>
          </div>
        </Container>
      </section>

      <section id="ministry" data-brand="ministry" className="bg-black py-16 text-white">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
                Online Ministry
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Repent Online Ministries
              </h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-brand-secondary">
                {t.text("ministryMotto")}
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{t.text("ministryText")}</p>
              <div className="mt-4">
                <SocialLinks />
              </div>
              <div className="mt-6">
                <Button href="/ministry" variant="outline">
                  Learn more about the ministry
                </Button>
              </div>
            </div>
            <Image
              src={brands.ministry.logo.src}
              alt="Repent Online Ministries logo"
              width={220}
              height={(220 * brands.ministry.logo.height) / brands.ministry.logo.width}
              className="mx-auto"
            />
          </div>
        </Container>
      </section>

      <section id="why" className="py-16">
        <Container>
          <SectionHeading eyebrow="Why ZIVARUKAH" title={t.text("whyTitle")} align="center" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyArukah.map((item) => (
              <div key={item.title} className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
                <h3 className="text-sm font-semibold text-brand-primary-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground/70">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <SharePage
        path="/"
        title="ZIVARUKAH"
        message={"✨ *ZIVARUKAH* — Creating Solutions. Building Skills. Serving Communities.\n\nBooks, the FREE ZIVA Literacy app, tech, media, footwear and Repent Online Ministries — all in one place 👇"}
        heading="📣 Share ZIVARUKAH"
        note="Tell friends and family about everything here."
      />

      <section id="contact" className="py-20">
        <Container>
          <div className="rounded-3xl border border-black/10 bg-black/5 p-10 text-center dark:border-white/10 dark:bg-white/5">
            <SectionHeading
              align="center"
              eyebrow="Get in touch"
              title={t.text("contactTitle")}
              description={t.text("contactText")}
            />
            <div className="mt-6">
              <Button href="/contact">Go to contact form</Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { ProgrammesSection } from "@/features/programmes/ProgrammesSection";
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
import { QuoteOfTheDay } from "@/features/quote/QuoteOfTheDay";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { verseOfTheDay } from "@/server/bible";
import { shareCardHref, shareLinkPath } from "@/lib/bible";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { socialLinks } from "@/config/social";
import { BRANCHES, FOUNDER, NAME_MEANING_SHORT, ORG_DESCRIPTION, founderLd } from "@/config/founder";
import { WHATSAPP_URL, whatsappLink } from "@/config/forms";
import { homePage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { CompletedWork } from "@/features/portfolio/CompletedWork";
import { listArticles } from "@/db/articles";
import { ArticleCard } from "@/features/articles/ArticleCard";

const SITE = process.env.SITE_URL || "https://zivarukah.com";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export default async function Home() {
  // Admin-edited text over the original wording (Admin → Page text).
  const [t, { articles }, ministryVerse] = await Promise.all([getPageText(homePage).then(textReader), listArticles({ limit: 3 }), verseOfTheDay()]);

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
              alternateName: ["ZIVA ARUKAH", "Ziva Arukah", "Zivarukah Ventures"],
              url: SITE,
              logo: `${SITE}${brands.arukah.logo.src}`,
              slogan: "Creating Solutions. Building Skills. Serving Communities.",
              description: ORG_DESCRIPTION,
              founder: { "@id": `${SITE.replace(/\/$/, "")}/#founder` },
              areaServed: "GH",
              // Only real profile pages (search-result links are left out).
              sameAs: socialLinks.map((link) => link.href).filter((href) => !href.includes("/search/") && !href.includes("wa.me")),
              department: BRANCHES.map((b) => ({
                "@type": b.type,
                name: b.name,
                alternateName: b.alt,
                url: `${SITE.replace(/\/$/, "")}${b.path}`,
                description: b.description,
                parentOrganization: { "@id": `${SITE.replace(/\/$/, "")}/#organization` },
                founder: { "@id": `${SITE.replace(/\/$/, "")}/#founder` },
              })),
            },
            founderLd(SITE),
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
      {/* Signpost to the Bible guide: links shared from the Bible land on this homepage. */}
      <section id="bible" aria-label="R.O.M Bible Guide" data-brand="ministry" className="bg-[#14110c] text-white">
        <Container>
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-[#f0c050]">📖 R.O.M Bible Guide</p>
              <p className="text-sm text-white/75">
                {ministryVerse ? <>Today: “{ministryVerse.verses.map((v) => v.text).join(" ").slice(0, 110)}{ministryVerse.verses.map((v) => v.text).join(" ").length > 110 ? "…" : ""}” ({ministryVerse.label})</> : "The Holy Bible, daily devotional, studies and topics. Free."}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-sm font-semibold">
              <a href="/bible" className="rounded-full bg-[#e3a82a] px-4 py-2 text-[#14110c]">
                Open the Bible guide →
              </a>
              <a href="/bible/devotionals" className="rounded-full border border-white/30 px-4 py-2">
                🌅 Today&apos;s devotional
              </a>
              <a href="/bible#daily" className="rounded-full border border-white/30 px-4 py-2">
                🔔 Daily alerts
              </a>
            </div>
          </div>
        </Container>
      </section>
      <AdBanner branch="home" />
      <Hero
        logo={brands.arukah.logo}
        title="ZIVARUKAH"
        tagline={t.text("heroTagline")}
        supportingLine={t.text("heroSupportingLine")}
        primaryCta={{ label: "Explore ZIVARUKAH", href: "#businesses" }}
        secondaryCta={{ label: "Chat on WhatsApp", href: WHATSAPP_URL }}
      />
      <ProgrammesSection branch="home" compact />

      <section id="businesses" className="scroll-mt-20 py-14">
        <Container>
          <SectionHeading eyebrow="Our businesses" title={t.text("businessesTitle")} align="center" />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <BusinessCard brand="tech" name="ARUKAH TECH" description={t.text("techCard")} href="/tech" logo={brands.tech.logo} />
            <BusinessCard brand="footwear" name="ARUKAH WEAR" description={t.text("wearCard")} href="/footwear" logo={brands.footwear.logo} />
            <BusinessCard brand="ziva" name="ZIVA Special Classes" description={t.text("zivaCard")} href="/ziva" logo={brands.ziva.logo} />
            <BusinessCard
              brand="literacy"
              name="ZIVA Literacy app"
              description={t.text("literacyCard")}
              href="/literacy"
              logo={{ src: "/branding/ziva-literacy/logo.webp", width: 128, height: 128 }}
            />
            <BusinessCard brand="books" name="ZIVARUKAH BOOKS" description={t.text("booksCard")} href="/books" logo={brands.arukah.logo} />
            <BusinessCard brand="books" name="Online programmes" description="Classes, trainings and ministry programmes on Zoom and Google Meet. Register for your code." href="/programmes" logo={brands.arukah.logo} />
          </div>
        </Container>
      </section>

      <section id="projects" className="bg-black/[0.03] py-14 dark:bg-white/[0.03]">
        <Container>
          <SectionHeading eyebrow="Featured work" title={t.text("projectsTitle")} description={t.text("projectsText")} />
          <div className="mt-10">
            <CompletedWork />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/tech">ARUKAH TECH services</Button>
            <Button href={whatsappLink("Hello ARUKAH TECH, I would like a website / management system for ")} variant="outline">
              Discuss a project
            </Button>
          </div>
        </Container>
      </section>

      {articles.length > 0 && (
        <section id="articles" className="py-14">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeading eyebrow="Articles" title="Latest articles" />
              <Button href="/articles" variant="outline">
                All articles
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <AdSlot branch="home" />

      <section id="about" className="py-14">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,320px)_1fr]">
            <Image
              src={FOUNDER.photo.src}
              alt={`${FOUNDER.name}, founder of ZIVARUKAH`}
              width={FOUNDER.photo.width}
              height={FOUNDER.photo.height}
              sizes="(min-width: 1024px) 320px, 70vw"
              className="mx-auto w-full max-w-xs rounded-2xl shadow-md"
            />
            <div>
              <SectionHeading eyebrow="About ZIVARUKAH" title={t.text("aboutTitle")} description={t.text("aboutText")} />
              <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/75">
                {NAME_MEANING_SHORT} Founded and led by <strong>{FOUNDER.name}</strong>, based in the Ashanti Region of Ghana.
              </p>
              <div className="mt-6">
                <Button href="/about" variant="outline">
                  Read our story
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <QuoteOfTheDay />

      <section id="ministry" data-brand="ministry" className="bg-black py-14 text-white">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Online Ministry</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Repent Online Ministries</h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-brand-secondary">{t.text("ministryMotto")}</p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">{t.text("ministryText")}</p>
              <div className="mt-4">
                <SocialLinks />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/ministry" variant="outline">
                  Visit the ministry
                </Button>
                <Button href="/ministry/support">🙏 Support the outreach</Button>
              </div>
              <ShareButtons
                className="mt-6"
                dark
                label="Share"
                url={`${SITE}${ministryVerse ? shareLinkPath(ministryVerse.ref) : "/"}`}
                title="Repent Online Ministries"
                image={ministryVerse ? shareCardHref(ministryVerse.ref) : undefined}
                message={ministryVerse ? `✝️ *Repent Online Ministries*\n\n“${ministryVerse.verses.map((v) => v.text).join(" ")}”\n— ${ministryVerse.label} (KJV)` : "✝️ *Repent Online Ministries*\n\nRescue the perishing. Follow, pray with us and support the outreach 👇"}
              />
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

      <GallerySection branch="home" />
      <ProjectsSection branch="home" eyebrow="Latest" title="Recent projects" />

      <section id="contact" className="py-16">
        <Container>
          <div className="rounded-3xl border border-black/10 bg-black/5 p-8 text-center sm:p-10 dark:border-white/10 dark:bg-white/5">
            <SectionHeading align="center" eyebrow="Get in touch" title={t.text("contactTitle")} description={t.text("contactText")} />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-black">
                💬 Chat on WhatsApp
              </a>
              <Button href="/contact" variant="outline">
                All contact options
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

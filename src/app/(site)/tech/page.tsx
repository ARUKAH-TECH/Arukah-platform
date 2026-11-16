import type { Metadata } from "next";
import { ProgrammesSection } from "@/features/programmes/ProgrammesSection";
import Link from "next/link";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { GallerySection } from "@/features/gallery/GallerySection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { techPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { SharePage } from "@/components/ui/SharePage";
import { CompletedWork } from "@/features/portfolio/CompletedWork";
import { JsonLd } from "@/components/seo/JsonLd";
import { whatsappLink } from "@/config/forms";

const QUOTE_FOR = [
  { icon: "🌐", label: "A website", msg: "a website for my church / school / business" },
  { icon: "⛪", label: "A church management system", msg: "a church management system" },
  { icon: "🏫", label: "A school or business system", msg: "a management system for my school / business" },
  { icon: "🛠️", label: "Fix or improve my website", msg: "fixing or improving my existing website" },
];

const STEPS = [
  { title: "Tell us what you need", text: "Message us on WhatsApp: what the website or system is for and what it should do." },
  { title: "Agree on the plan and price", text: "We suggest the pages and features, then agree the price and timeline with you before work starts." },
  { title: "Review a preview", text: "You see and test a working preview, and ask for changes before anything goes live." },
  { title: "Go live", text: "We publish it on your web address and show you how to use it." },
];

const TECH_FAQ = [
  {
    q: "How much does a website or management system cost?",
    a: "It depends on the pages and features you need. Tell us what you want on WhatsApp and we will give you a clear quote before any work starts.",
  },
  {
    q: "Do you build church management systems?",
    a: "Yes. We built a church management system and a website for Bethel Inspiration Foundation. You can see them under Our work on this page.",
  },
  {
    q: "Do you only work in Kumasi?",
    a: "We are based in the Ashanti Region, and websites and systems can be planned and reviewed online, so we can work with churches, schools and businesses anywhere in Ghana.",
  },
];

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Websites & Church Management Systems in Ghana | ARUKAH TECH" },
  description: "We build websites and management systems for churches, schools and businesses in Ghana. See our completed work, then chat with us on WhatsApp for a quote.",
  alternates: { canonical: "/tech" },
  openGraph: { title: "Websites & Church Management Systems in Ghana | ARUKAH TECH", description: "We build websites and management systems for churches, schools and businesses in Ghana. See our completed work, then chat with us on WhatsApp for a quote." },
};

export default async function TechPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(techPage));
  const serviceGroups = [1, 2, 3].map((n) => ({
    title: t.text(`group${n}Title`),
    items: t.list(`group${n}Items`),
  }));

  return (
    <div data-brand="tech">
      <AnnouncementBar branch="tech" />
      <AdBanner branch="tech" />
      <Hero
        logo={brands.tech.logo}
        title="ARUKAH TECH"
        tagline={t.text("heroTagline")}
        primaryCta={{ label: "Request a quotation", href: "#quote" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />
      <ProgrammesSection branch="tech" />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we build" title={t.text("servicesTitle")} align="center" />
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {serviceGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-primary-text">
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

      <section id="work" className="py-16">
        <Container>
          <SectionHeading align="center" eyebrow="Our work" title={t.text("projectsTitle")} description={t.text("projectsText")} />
          <div className="mt-10">
            <CompletedWork />
          </div>
          <p className="mt-8 text-center text-sm text-foreground/70">
            Need a website or a management system for your church, school or business?{" "}
            <Link href="#quote" className="font-semibold text-brand-primary-text underline">
              Request a quotation
            </Link>
          </p>
        </Container>
      </section>

      <section id="quote" className="scroll-mt-20 bg-black/[0.03] py-16 dark:bg-white/[0.03]">
        <Container>
          <SectionHeading align="center" eyebrow="How it works" title="From your idea to a working website" />
          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-brand-on-primary">{i + 1}</p>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-foreground/75">{step.text}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-12 text-center text-xl font-bold tracking-tight">Request a quotation</h3>
          <p className="mt-1 text-center text-sm text-foreground/70">Choose one. WhatsApp opens with your request started; add the details and send.</p>
          <ul className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {QUOTE_FOR.map((q) => (
              <li key={q.label}>
                <a
                  href={whatsappLink(`Hello ARUKAH TECH, I would like a quotation for ${q.msg}. Details: `)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 font-semibold shadow-sm hover:border-[#25D366] dark:border-white/10 dark:bg-white/5"
                >
                  <span className="text-xl" aria-hidden="true">
                    {q.icon}
                  </span>
                  <span className="min-w-0 flex-1">{q.label}</span>
                  <span className="text-sm text-[#128C7E]" aria-hidden="true">
                    WhatsApp →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="faq" className="py-16">
        <Container>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: TECH_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }}
          />
          <SectionHeading align="center" eyebrow="Questions" title="Common questions" />
          <dl className="mx-auto mt-8 flex max-w-3xl flex-col gap-4">
            {TECH_FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <dt className="font-bold">{f.q}</dt>
                <dd className="mt-2 text-sm leading-6 text-foreground/80">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl bg-brand-primary p-8 text-center text-brand-on-primary shadow-md sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to start your project?</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 opacity-90">
              Tell us what you need. We will discuss your idea, agree the features and give you a clear price before any work begins.
            </p>
            <a
              href={whatsappLink("Hello ARUKAH TECH, I am ready to start a project. Here is what I need: ")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3 font-bold text-black hover:opacity-90"
            >
              💬 Start my project on WhatsApp
            </a>
          </div>
        </Container>
      </section>

      <AdSlot branch="tech" />


      <GallerySection branch="tech" />
      <ProjectsSection branch="tech" />
      <SharePage
        path="/tech"
        title="ARUKAH TECH"
        message={"💻 *ARUKAH TECH*\n\nWebsites, apps and management systems for schools, churches and businesses 👇"}
        heading="📣 Share ARUKAH TECH"
      />
    </div>
  );
}

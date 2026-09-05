import type { Metadata } from "next";
import Image from "next/image";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { Button } from "@/components/ui/Button";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { brands } from "@/config/brands";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const techServices = [
  "Website & software development",
  "School, church & fuel station management systems",
  "Cloud & deployment support",
  "Ongoing maintenance & technical support",
];

const footwearHighlights = [
  "Slippers & sandals",
  "Men's, women's & children's footwear",
  "Custom & wholesale orders",
];

const mediaServices = [
  "Video production",
  "Event coverage",
  "Video editing",
  "Promotional videos",
];

const whyArukah = [
  {
    title: "Solutions built for real needs",
    description: "Technology and systems designed around how organizations actually work.",
  },
  {
    title: "Skills that last",
    description: "Education and training focused on genuine, lasting excellence.",
  },
  {
    title: "Craftsmanship you can trust",
    description: "Footwear made with attention to material and quality, not shortcuts.",
  },
  {
    title: "Communities, not just customers",
    description: "Every division exists to serve people first — commercially and in ministry.",
  },
];

export default function Home() {
  return (
    <>
      <Hero
        logo={brands.arukah.logo}
        title="ARUKAH"
        tagline="Creating Solutions. Building Skills. Serving Communities."
        supportingLine="Technology • Education • Manufacturing • Media"
        primaryCta={{ label: "Explore ARUKAH", href: "#businesses" }}
        secondaryCta={{ label: "Contact Us", href: "/contact" }}
      />

      <section id="about" className="py-16">
        <Container>
          <SectionHeading
            eyebrow="About"
            title="One brand, several ways to serve"
            description="ARUKAH brings together technology, education, manufacturing, media and ministry under one identity — each division run with its own craft, but the same purpose: creating solutions, building skills, and serving communities."
          />
        </Container>
      </section>

      <section id="businesses" className="py-16">
        <Container>
          <SectionHeading eyebrow="Our Businesses" title="What ARUKAH builds" align="center" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <BusinessCard
              brand="tech"
              name="ARUKAH TECH"
              description="Software, websites, and management systems."
              href="/tech"
              logo={brands.tech.logo}
            />
            <BusinessCard
              brand="footwear"
              name="ARUKAH WEAR"
              description="Ghana-made, handcrafted footwear."
              href="/footwear"
              logo={brands.footwear.logo}
            />
            <BusinessCard
              brand="ziva"
              name="ZIVA Special Classes"
              description="Special classes from Primary 1 to SHS 3."
              href="/ziva"
              logo={brands.ziva.logo}
            />
            <BusinessCard
              brand="media"
              name="ARUKAH MEDIA"
              description="Video production and creative media."
              href="/media"
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
                title="Innovate. Develop. Empower."
                description="Custom software and management systems built for schools, churches, fuel stations, and other organizations that need reliable, well-maintained technology."
              />
              <ul className="mt-6 flex flex-col gap-2 text-sm text-foreground/70">
                {techServices.map((service) => (
                  <li key={service} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                    {service}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button href="/tech">Learn more</Button>
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
            title="Systems in development"
            description="A look at the kind of management systems ARUKAH TECH builds. Screenshots and case studies are added here as projects are completed."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {["School Management System", "Church Management System", "Fuel Station Management System"].map(
              (project) => (
                <div
                  key={project}
                  className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 p-6 text-center dark:border-white/15"
                >
                  <p className="text-sm font-medium">{project}</p>
                  <p className="mt-1 text-xs text-foreground/50">Preview coming soon</p>
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
                title="Home of classic and quality wears"
                description="Ghana-made footwear, crafted with attention to material and durability — from everyday slippers to custom pairs."
              />
              <ul className="mt-6 flex flex-col gap-2 text-sm text-foreground/70">
                {footwearHighlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-foreground/50">
                Product photos and pricing are added once real inventory is ready.
              </p>
              <div className="mt-6">
                <Button href="/footwear">Learn more</Button>
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
                title="Excellence our hallmark"
                description="Special classes for students from Primary 1 to SHS 3, focused on genuine academic growth."
              />
              <div className="mt-6 flex flex-wrap gap-4">
                <Button href="/ziva">Learn more</Button>
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
          <SectionHeading eyebrow="ARUKAH MEDIA" title="Creative media, done well" align="center" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {mediaServices.map((service) => (
              <div
                key={service}
                className="rounded-xl border border-black/10 p-4 text-center text-sm font-medium dark:border-white/10"
              >
                {service}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button href="/media">Learn more</Button>
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
                Rescue the Perishing
              </p>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                Kept visually and editorially separate from the commercial ARUKAH
                businesses. Follow along as content is published across:
              </p>
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
          <SectionHeading eyebrow="Why ARUKAH" title="What holds it together" align="center" />
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

      <section id="contact" className="py-20">
        <Container>
          <div className="rounded-3xl border border-black/10 bg-black/5 p-10 text-center dark:border-white/10 dark:bg-white/5">
            <SectionHeading
              align="center"
              eyebrow="Get in touch"
              title="Let's talk about your project"
              description="Tell us a bit about what you need and we'll get back to you."
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

import type { Metadata } from "next";
import { ProgrammesSection } from "@/features/programmes/ProgrammesSection";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";
import { ProjectsSection } from "@/features/projects/ProjectsSection";
import { GallerySection } from "@/features/gallery/GallerySection";
import { AnnouncementBar } from "@/features/announcements/AnnouncementBar";
import { AdSlot } from "@/features/ads/AdSlot";
import { AdBanner } from "@/features/ads/AdBanner";
import { wearPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";
import { SharePage } from "@/components/ui/SharePage";
import { whatsappLink } from "@/config/forms";

const ORDER_STEPS = [
  { title: "Choose what you want", text: "Footwear, T-shirts, branded wear or your own design. A photo or sample helps." },
  { title: "Send the details", text: "Sizes, colours, quantity, any name or logo to print, and when you need it." },
  { title: "Get today's price", text: "Prices change with materials and quantity, so we confirm the current price for your order." },
  { title: "Confirm your order", text: "Once you agree, we make your order and agree with you how you will receive it." },
];

const ASK_PRICE = [
  { icon: "👟", label: "Footwear", msg: "footwear (slippers / sandals / shoes)" },
  { icon: "👕", label: "T-shirts and clothing", msg: "T-shirts / clothing" },
  { icon: "⛪", label: "Branded wear for an event", msg: "branded wear for our church / school / event" },
  { icon: "📦", label: "Wholesale order", msg: "a wholesale order" },
];

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ARUKAH WEAR: Footwear, Clothing & Branded Wear in Ghana",
  description:
    "ARUKAH WEAR offers Ghana-made slippers, sandals and footwear, clothing and custom branded wear for churches, schools and events. Custom and wholesale orders welcome.",
  alternates: { canonical: "/footwear" },
  openGraph: { title: "ARUKAH WEAR: Footwear, Clothing & Branded Wear | ZIVARUKAH", description: "ARUKAH WEAR offers Ghana-made slippers, sandals and footwear, clothing and custom branded wear for churches, schools and events. Custom and wholesale orders welcome." },
};

export default async function FootwearPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(wearPage));

  return (
    <div data-brand="footwear">
      <AnnouncementBar branch="wear" />
      <AdBanner branch="wear" />
      <Hero
        logo={brands.footwear.logo}
        title="ARUKAH WEAR"
        tagline={t.text("heroTagline")}
        primaryCta={{ label: "Ask for today’s price", href: "#order" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />
      <ProgrammesSection branch="wear" />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we make" title={t.text("productsTitle")} align="center" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {t.list("products").map((product) => (
              <div
                key={product}
                className="rounded-xl border border-black/10 p-4 text-center text-sm font-medium dark:border-white/10"
              >
                {product}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-foreground/60">{t.text("productsNote")}</p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Craftsmanship"
            title={t.text("craftTitle")}
            description={t.text("craftText")}
          />
        </Container>
      </section>

      <section id="order" className="scroll-mt-20 bg-black/[0.03] py-16 dark:bg-white/[0.03]">
        <Container>
          <SectionHeading align="center" eyebrow="How to order" title="Ordering is simple" />
          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER_STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-brand-on-primary">{i + 1}</p>
                <h3 className="mt-3 font-bold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-foreground/75">{step.text}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-12 text-center text-xl font-bold tracking-tight">Ask for today&apos;s price</h3>
          <p className="mt-1 text-center text-sm text-foreground/70">Choose one. WhatsApp opens with your request started; add sizes, colours and quantity.</p>
          <ul className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
            {ASK_PRICE.map((q) => (
              <li key={q.label}>
                <a
                  href={whatsappLink(`Hello ARUKAH WEAR, I would like today's price for ${q.msg}. Details (sizes, colours, quantity): `)}
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

      <AdSlot branch="wear" />


      <GallerySection branch="wear" />
      <ProjectsSection branch="wear" />
      <SharePage
        path="/footwear"
        title="ARUKAH WEAR"
        message={"👟 *ARUKAH WEAR*\n\nFootwear, clothing and branded wear, made with care 👇"}
        heading="📣 Share ARUKAH WEAR"
      />
    </div>
  );
}

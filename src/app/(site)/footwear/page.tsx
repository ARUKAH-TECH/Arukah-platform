import type { Metadata } from "next";
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

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "ARUKAH WEAR — Handcrafted, Ghana-Made Footwear",
  description:
    "ARUKAH WEAR makes quality handcrafted slippers, sandals and men's, women's and children's footwear in Ghana. Custom and wholesale orders welcome.",
  alternates: { canonical: "/footwear" },
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
        primaryCta={{ label: "Enquire about wholesale", href: "/contact" }}
        secondaryCta={{ label: "Back to ZIVARUKAH", href: "/" }}
      />

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

      <AdSlot branch="wear" />


      <GallerySection branch="wear" />
      <ProjectsSection branch="wear" />
      <SharePage
        path="/footwear"
        title="ARUKAH WEAR"
        message={"👞 *ARUKAH WEAR*\n\nQuality footwear made with care 👇"}
        heading="📣 Share ARUKAH WEAR"
      />
    </div>
  );
}

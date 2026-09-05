import type { Metadata } from "next";
import { Hero } from "@/components/ui/Hero";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { brands } from "@/config/brands";

export const metadata: Metadata = {
  title: "WEAR",
  description: "Ghana-made, handcrafted footwear from ARUKAH WEAR.",
  alternates: { canonical: "/footwear" },
};

const products = [
  "Slippers",
  "Sandals",
  "Men's footwear",
  "Women's footwear",
  "Children's footwear",
  "Custom footwear",
  "Wholesale orders",
];

export default function FootwearPage() {
  return (
    <div data-brand="footwear">
      <Hero
        logo={brands.footwear.logo}
        title="ARUKAH WEAR"
        tagline="Home of classic and quality wears. Ghana-made footwear, crafted with attention to material and durability."
        primaryCta={{ label: "Enquire about wholesale", href: "/contact" }}
        secondaryCta={{ label: "Back to ARUKAH", href: "/" }}
      />

      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="What we make" title="Products" align="center" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {products.map((product) => (
              <div
                key={product}
                className="rounded-xl border border-black/10 p-4 text-center text-sm font-medium dark:border-white/10"
              >
                {product}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-foreground/50">
            Product photos and pricing are added once real inventory is ready.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Craftsmanship"
            title="Handcrafted, premium, Ghana-made"
            description="Every pair is made with attention to material and quality, not shortcuts — durable footwear built to last, with style that holds up."
          />
        </Container>
      </section>
    </div>
  );
}

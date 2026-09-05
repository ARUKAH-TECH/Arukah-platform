import Image from "next/image";
import type { Metadata } from "next";
import { brands } from "@/config/brands";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const swatches = [
  { label: "Primary", varName: "--brand-primary" },
  { label: "Primary hover", varName: "--brand-primary-hover" },
  { label: "Secondary", varName: "--brand-secondary" },
  { label: "On primary (text)", varName: "--brand-on-primary" },
] as const;

export default function StyleGuidePage() {
  return (
    <div className="py-16">
      <Container>
        <SectionHeading
          eyebrow="Internal — not linked from the site"
          title="ARUKAH design system"
          description="Per-division brand tokens and shared components. Wrap any section in data-brand to scope Button/SectionHeading colors to that division."
        />

        <div className="mt-12 flex flex-col gap-16">
          {Object.values(brands).map((brand) => (
            <section key={brand.id} data-brand={brand.id === "arukah" ? undefined : brand.id}>
              <div className="flex items-center gap-4">
                <Image
                  src={brand.logo.src}
                  alt={`${brand.name} logo`}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-lg object-contain"
                  style={{ backgroundColor: "#111" }}
                />
                <h3 className="text-lg font-semibold">
                  {brand.name}{" "}
                  <code className="text-xs font-normal text-foreground/50">
                    data-brand=&quot;{brand.id}&quot;
                  </code>
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {swatches.map((swatch) => (
                  <div key={swatch.varName} className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                    <div
                      className="h-16 w-full"
                      style={{ backgroundColor: `var(${swatch.varName})` }}
                    />
                    <div className="p-2 text-xs">
                      <p className="font-medium">{swatch.label}</p>
                      <p className="text-foreground/50">{swatch.varName}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary button</Button>
                <Button variant="secondary">Secondary button</Button>
                <Button variant="outline">Outline button</Button>
              </div>

              <div className="mt-4">
                <Card>
                  <p className="text-sm text-foreground/70">
                    Card content is brand-agnostic by design — only accents
                    (buttons, headings, links) switch per division.
                  </p>
                </Card>
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}

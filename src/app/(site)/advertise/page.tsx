import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AdvertiseForm } from "@/features/advertise/AdvertiseForm";
import { advertisePage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

export const metadata: Metadata = {
  title: "Advertise With Us",
  description: "Advertise your business on ZIVARUKAH.",
  alternates: { canonical: "/advertise" },
};

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export default async function AdvertisePage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(advertisePage));

  return (
    <div className="py-16">
      <Container>
        <SectionHeading align="center" eyebrow="Partner with ZIVARUKAH" title={t.text("title")} description={t.text("intro")} />

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-primary-text">How it works</h2>
            <ol className="mt-4 flex flex-col gap-3 text-sm text-foreground/70">
              {t.list("steps").map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-brand-on-primary">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-foreground/50">{t.text("note")}</p>
          </div>
          <div className="lg:col-span-3">
            <AdvertiseForm />
          </div>
        </div>
      </Container>
    </div>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/features/contact/ContactForm";
import { MinistryForm } from "@/features/ministry/MinistryForm";
import { contactPage } from "@/config/pages";
import { getPageText, textReader } from "@/db/pageContent";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact ZIVARUKAH about software, websites, footwear, special classes, video production, books or the ministry.",
  alternates: { canonical: "/contact" },
};

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export default async function ContactPage() {
  // Admin-edited text over the original wording (Admin → Page text).
  const t = textReader(await getPageText(contactPage));

  return (
    <div className="py-16">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Get in touch"
          title={t.text("title")}
          description={t.text("text")}
        />
        <div className="mx-auto mt-10 max-w-xl">
          <ContactForm />
        </div>
      </Container>

      <div className="mt-20 border-t border-black/10 py-16 dark:border-white/10" data-brand="ministry">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Online Ministry"
            title={t.text("ministryTitle")}
            description={t.text("ministryText")}
          />
          <div className="mx-auto mt-10 max-w-xl">
            <MinistryForm />
          </div>
        </Container>
      </div>
    </div>
  );
}

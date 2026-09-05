import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/features/contact/ContactForm";
import { MinistryForm } from "@/features/ministry/MinistryForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with ARUKAH.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="py-16">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Get in touch"
          title="Let's talk about your project"
          description="Tell us a bit about what you need and we'll get back to you."
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
            title="New here, or growing in faith?"
            description="This is a separate form for the ministry side of ARUKAH — for new and returning converts, or anyone wanting prayer or spiritual follow-up."
          />
          <div className="mx-auto mt-10 max-w-xl">
            <MinistryForm />
          </div>
        </Container>
      </div>
    </div>
  );
}

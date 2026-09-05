import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/features/contact/ContactForm";

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
    </div>
  );
}

import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AccessForm } from "@/features/programmes/AccessForm";

export const metadata: Metadata = {
  title: "Programme access: enter your code",
  description: "Enter your secret code to see the joining details for your ZIVARUKAH online programme.",
  alternates: { canonical: "/programmes/access" },
  robots: { index: false },
};

export default function ProgrammeAccessPage() {
  return (
    <section className="py-14">
      <Container>
        <div className="mx-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Online programmes</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">🔑 Enter your code</h1>
          <p className="mt-2 mb-6 text-foreground/70">Type the secret code you received when you registered to see how to join.</p>
          <AccessForm />
        </div>
      </Container>
    </section>
  );
}

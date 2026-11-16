import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { JsonLd } from "@/components/seo/JsonLd";

/** Common questions with FAQPage structured data (Google can show them in search). */
export function FaqSection({ items, title = "Common questions", id = "faq" }: { items: { q: string; a: string }[]; title?: string; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20 py-16">
      <Container>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
        <SectionHeading align="center" eyebrow="Questions" title={title} />
        <dl className="mx-auto mt-8 flex max-w-3xl flex-col gap-4">
          {items.map((f) => (
            <div key={f.q} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <dt className="font-bold">{f.q}</dt>
              <dd className="mt-2 text-sm leading-6 text-foreground/80">{f.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

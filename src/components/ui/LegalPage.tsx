import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { CONTACT_DISPLAY, WHATSAPP_URL } from "@/config/forms";

// Plain, readable layout for the Terms and Refunds pages.
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro: string; children: ReactNode }) {
  return (
    <section className="py-14">
      <Container>
        <article className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">ZIVARUKAH VENTURES</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-foreground/60">Last updated: {updated}</p>
          <p className="mt-6 leading-7 text-foreground/80">{intro}</p>
          <div className="mt-8 flex flex-col gap-8 leading-7 text-foreground/80 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-1.5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
          <p className="mt-10 rounded-2xl bg-black/5 p-5 text-sm leading-6 dark:bg-white/10">
            Questions? Message us on{" "}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              {CONTACT_DISPLAY}
            </a>
            . We are based in the Ashanti Region of Ghana.
          </p>
        </article>
      </Container>
    </section>
  );
}

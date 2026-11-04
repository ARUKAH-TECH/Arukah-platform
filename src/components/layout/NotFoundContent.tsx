import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { WHATSAPP_URL } from "@/config/forms";

// The "page not found" message, used by both not-found pages.
export function NotFoundContent() {
  const links = [
    { href: "/tech", label: "ARUKAH TECH" },
    { href: "/ziva", label: "ZIVA Special Classes" },
    { href: "/literacy", label: "ZIVA Literacy app" },
    { href: "/books", label: "ZIVARUKAH BOOKS" },
    { href: "/programmes", label: "Online programmes" },
    { href: "/ministry", label: "Repent Online Ministries" },
  ];
  return (
    <section className="py-20">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Page not found</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">We couldn&apos;t find that page</h1>
          <p className="mt-3 leading-7 text-foreground/70">The link may be old or mistyped. Here are some places to go instead.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/">Go to the homepage</Button>
            <Button href={WHATSAPP_URL} variant="outline">
              Ask us on WhatsApp
            </Button>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-xl border border-black/10 px-4 py-3 font-semibold hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

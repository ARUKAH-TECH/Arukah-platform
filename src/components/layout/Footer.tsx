import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { mainNav, businessNav } from "@/config/nav";
import { brands } from "@/config/brands";

export function Footer() {
  const logo = brands.arukah.logo;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 py-12 dark:border-white/10">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src={logo.src}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-base font-bold tracking-tight">ZIVARUKAH</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-foreground/70">
              Creating Solutions. Building Skills. Serving Communities.
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-foreground/70">
              <strong>ZIVARUKAH</strong> — Hebrew for <em>the light of God</em> (ZIVA) and <em>total restoration</em> (ARUKAH). Founded by Shepherd
              Justice Sarpong Oduro.{" "}
              <Link href="/about" className="font-semibold underline hover:text-brand-primary-text">
                Our story
              </Link>
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Navigate
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {mainNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-primary-text">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/advertise" className="hover:text-brand-primary-text">
                  Advertise with us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Businesses
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {businessNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-brand-primary-text">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-black/10 pt-6 text-xs text-foreground/60 dark:border-white/10">
          &copy; {year} ZIVARUKAH VENTURES.
        </p>
      </Container>
    </footer>
  );
}

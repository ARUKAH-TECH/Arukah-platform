import Image from "next/image";
import Link from "next/link";
import { mainNav, businessNav } from "@/config/nav";
import { brands } from "@/config/brands";

export function Header() {
  const logo = brands.arukah.logo;

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/#top" className="flex items-center gap-2">
          <Image
            src={logo.src}
            alt="ARUKAH"
            width={36}
            height={36}
            className="h-9 w-9 rounded-md object-contain"
            style={{ backgroundColor: "#0a0a0a" }}
          />
          <span className="text-lg font-bold tracking-tight">ARUKAH</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium md:flex">
          {mainNav.map((link, index) =>
            index === 1 ? (
              <span key={link.href} className="flex items-center gap-6">
                <Link href={link.href} className="hover:text-brand-primary">
                  {link.label}
                </Link>
                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-brand-primary">
                    Businesses
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    >
                      <path d="M5.5 7.5l4.5 5 4.5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                    {businessNav.map((biz) => (
                      <Link
                        key={biz.href}
                        href={biz.href}
                        className="block rounded-lg px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {biz.label}
                      </Link>
                    ))}
                  </div>
                </details>
              </span>
            ) : (
              <Link key={link.href} href={link.href} className="hover:text-brand-primary">
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <details className="group md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-center rounded-md p-2 hover:bg-black/5 dark:hover:bg-white/10">
            <span className="sr-only">Open menu</span>
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 group-open:hidden" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" className="hidden h-6 w-6 group-open:block" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </summary>
          <nav
            aria-label="Primary"
            className="flex flex-col gap-1 border-t border-black/10 px-4 py-3 text-sm font-medium dark:border-white/10"
          >
            {mainNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <p className="mt-2 px-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Businesses
            </p>
            {businessNav.map((biz) => (
              <Link
                key={biz.href}
                href={biz.href}
                className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {biz.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}

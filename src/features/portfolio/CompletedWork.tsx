import Image from "next/image";
import { PORTFOLIO } from "@/config/portfolio";

/** Cards for finished ARUKAH TECH projects (website + management system). */
export function CompletedWork() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {PORTFOLIO.map((item) => (
        <article
          key={item.id}
          className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
        >
          <Image
            src={item.image.src}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-video w-full object-cover"
          />
          <div className="flex flex-1 flex-col p-6">
            <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="rounded-full bg-brand-primary px-2.5 py-0.5 text-brand-on-primary">{item.kind}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-900">✓ Completed</span>
            </p>
            <h3 className="mt-3 text-xl font-bold tracking-tight">{item.title}</h3>
            <p className="mt-1 text-sm text-foreground/70">For: {item.client}</p>
            <p className="mt-3 text-sm leading-6 text-foreground/80">{item.text}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-foreground/80">
              {item.points.map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              {item.link ? (
                <a
                  href={item.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-brand-primary-text px-5 py-2 text-sm font-semibold text-brand-primary-text hover:bg-brand-primary hover:text-brand-on-primary"
                >
                  {item.link.label} ↗
                </a>
              ) : (
                item.note && <p className="text-xs text-foreground/60">🔒 {item.note}</p>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

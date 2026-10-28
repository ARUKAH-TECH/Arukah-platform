import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getWhatsNew, isFresh, type NewsItem, type NewsKind } from "./feed";

// Homepage strip of the newest things on the site. Swipe sideways on a phone;
// a grid on bigger screens. Every card opens the exact page.

const ART: Record<NewsKind, { emoji: string; bg: string }> = {
  book: { emoji: "📘", bg: "from-[#7a4a12] to-[#e3a82a]" },
  article: { emoji: "📰", bg: "from-[#1f2937] to-[#4b5563]" },
  project: { emoji: "🛠️", bg: "from-[#065f46] to-[#10b981]" },
  app: { emoji: "✏️", bg: "from-[#0b69a8] to-[#0b3d91]" },
};

function timeAgo(date: string) {
  const days = Math.round((Date.now() - Date.parse(date)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Card({ item, priority }: { item: NewsItem; priority: boolean }) {
  const art = ART[item.kind];
  const fresh = isFresh(item.date);
  const body = (
    <>
      <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${art.bg}`}>
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"
            className={`transition-transform duration-500 group-hover:scale-105 ${item.kind === "book" ? "object-contain p-3 drop-shadow-xl" : "object-cover"}`}
          />
        ) : (
          <div aria-hidden="true" className="flex h-full items-center justify-center text-7xl drop-shadow-lg transition-transform duration-500 group-hover:scale-110">
            {art.emoji}
          </div>
        )}
        {fresh && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#e3a82a] px-3 py-1 text-xs font-extrabold tracking-wider text-[#14110c] shadow">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            NEW
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
          {item.label} · <span className="font-normal normal-case tracking-normal text-foreground/50">{timeAgo(item.date)}</span>
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug tracking-tight">{item.title}</h3>
        {item.teaser && <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/70">{item.teaser}</p>}
        <span className="mt-auto pt-4 text-sm font-semibold text-brand-primary-text group-hover:underline">{item.cta}</span>
      </div>
    </>
  );
  const className =
    "reveal-pop group flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-black/10 bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:w-auto dark:border-white/10";
  return item.external ? (
    <a href={item.href} className={className}>
      {body}
    </a>
  ) : (
    <Link href={item.href} className={className}>
      {body}
    </Link>
  );
}

export async function WhatsNew() {
  const items = await getWhatsNew(6);
  if (items.length === 0) return null;
  return (
    <section id="whats-new" className="py-12" aria-labelledby="whats-new-title">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">✨ What&apos;s new</p>
            <h2 id="whats-new-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Fresh from ZIVARUKAH
            </h2>
          </div>
          <p className="hidden text-sm text-foreground/50 sm:block">Tap any card to open it</p>
        </div>
        <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {items.map((item, i) => (
            <Card key={item.key} item={item} priority={i === 0} />
          ))}
        </div>
        {items.length > 1 && <p className="mt-1 text-center text-xs text-foreground/50 sm:hidden">Swipe for more →</p>}
      </Container>
    </section>
  );
}

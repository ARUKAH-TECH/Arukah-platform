import Image from "next/image";
import Link from "next/link";
import { FOUNDER } from "@/config/founder";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { todaysQuote } from "./todaysQuote";
import { ListenButton } from "./ListenButton";

const SITE = process.env.SITE_URL || "https://zivarukah.com";

export async function QuoteOfTheDay() {
  const quote = await todaysQuote();
  const isVerse = quote.kind !== "book"; // dark style for verses and the founder's words
  const isFounder = quote.kind === "founder";
  const label = isFounder ? "🕊️ Word of the day" : quote.kind === "verse" ? "✝️ Verse of the day" : "📘 Quote of the day";
  return (
    <section aria-labelledby="quote-title" className="py-10">
      <Container>
        <figure
          className={`relative overflow-hidden rounded-3xl p-8 shadow-lg sm:p-12 ${
            isVerse ? "bg-gradient-to-br from-[#14110c] to-[#3b2f14] text-white" : "bg-gradient-to-br from-[#fdf3dc] to-[#f3d48a] text-[#14110c]"
          }`}
        >
          <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-5 font-serif text-[10rem] leading-none opacity-15">
            “
          </span>
          <p id="quote-title" className={`relative text-xs font-semibold uppercase tracking-widest ${isVerse ? "text-[#f0c050]" : "text-[#7a4a12]"}`}>
            {label}
          </p>
          <blockquote className="relative mt-4 max-w-3xl font-serif text-2xl italic leading-snug sm:text-3xl">{quote.text}</blockquote>
          <figcaption className={`relative mt-4 flex items-center gap-3 text-sm font-medium ${isVerse ? "text-white/70" : "text-[#14110c]/70"}`}>
            {isFounder && (
              <Image src={FOUNDER.photo.src} alt="" width={48} height={48} className="h-12 w-12 rounded-full border-2 border-[#f0c050] object-cover object-top" />
            )}
            <span>{isFounder ? `— ${quote.source}` : quote.source}</span>
          </figcaption>
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <ListenButton text={`${quote.text} ${quote.source.replace("(KJV)", "")}`} dark={isVerse} />
            <Link href={quote.href} className={`text-sm font-semibold underline-offset-4 hover:underline ${isVerse ? "text-[#f0c050]" : "text-[#7a4a12]"}`}>
              {quote.linkLabel}
            </Link>
          </div>
          <ShareButtons
            className="relative mt-5"
            dark={isVerse}
            label="Share today's line"
            url={`${SITE}/q/today/${Math.floor(Date.now() / 86_400_000)}`}
            title={isFounder ? "Word of the day" : isVerse ? "Verse of the day" : "Quote of the day"}
            image={`/api/share-card?quote=today&d=${Math.floor(Date.now() / 86_400_000)}`}
            message={`${isFounder ? "🕊️ *Word of the day*" : isVerse ? "✝️ *Verse of the day*" : "📘 *Quote of the day*"}\n\n“${quote.text}”\n(${quote.source})`}
          />
        </figure>
      </Container>
    </section>
  );
}

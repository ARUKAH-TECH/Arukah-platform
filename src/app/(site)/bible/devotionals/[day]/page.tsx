import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { ArticleBody } from "@/features/articles/ArticleBody";
import { ListenButton } from "@/features/quote/ListenButton";
import { BibleShell } from "@/features/bible/BibleShell";
import { Passages } from "@/features/bible/Passages";
import { getDevotional } from "@/db/bible";
import { parseReference, shareCardHref, shareLinkPath } from "@/lib/bible";

const SITE = process.env.SITE_URL || "https://zivarukah.com";
export const revalidate = 600;

const plain = (s: string) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#*>_]/g, "").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: PageProps<"/bible/devotionals/[day]">): Promise<Metadata> {
  const d = await getDevotional((await params).day);
  if (!d) return { title: "Devotional" };
  const description = plain(d.body).slice(0, 155);
  return {
    title: { absolute: `${d.title} | Daily Devotional, R.O.M Bible Guide` },
    description,
    alternates: { canonical: `/bible/devotionals/${d.day}` },
    openGraph: { title: d.title, description },
  };
}

export default async function DevotionalPage({ params }: PageProps<"/bible/devotionals/[day]">) {
  const d = await getDevotional((await params).day);
  if (!d) notFound();
  const firstRef = d.verseRef ? parseReference(d.verseRef.split(/[;\n]/)[0] ?? "") : null;
  const when = new Date(`${d.day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <BibleShell active="devotionals">
      <Container>
        <article className="mx-auto max-w-3xl py-10">
          <Link href="/bible/devotionals" className="text-sm text-foreground/60 hover:text-brand-primary-text">
            ← All devotionals
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Daily devotional · {when}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{d.title}</h1>
          <div className="mt-4">
            <ListenButton text={`${d.title}. ${plain(d.body)} ${d.prayer ? `Prayer. ${plain(d.prayer)}` : ""}`} />
          </div>
          {d.verseRef && (
            <div className="mt-6">
              <Passages refs={d.verseRef} />
            </div>
          )}
          <div className="mt-6">
            <ArticleBody content={d.body} />
          </div>
          {d.prayer && (
            <section className="mt-8 rounded-2xl bg-[#14110c] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#e3a82a]">🙏 Prayer</p>
              <p className="mt-2 whitespace-pre-line font-serif text-lg leading-8">{d.prayer}</p>
            </section>
          )}
          <ShareButtons
            className="mt-8"
            label="Share"
            url={`${SITE}${firstRef ? shareLinkPath(firstRef) : "/"}`}
            title={d.title}
            image={firstRef ? shareCardHref(firstRef) : undefined}
            message={`🌅 *${d.title}*${d.verseRef ? ` (${d.verseRef})` : ""}\n\nToday's devotional from Repent Online Ministries.\n\n📖 Open *R.O.M Bible Guide* on our homepage 👇`}
          />
        </article>
      </Container>
    </BibleShell>
  );
}

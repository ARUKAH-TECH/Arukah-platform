import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BibleShell } from "@/features/bible/BibleShell";
import { listDevotionals } from "@/db/bible";

export const metadata: Metadata = {
  title: { absolute: "Daily Devotionals | Repent Online Ministries" },
  description: "A short Bible devotional with a prayer for each day, from Repent Online Ministries.",
  alternates: { canonical: "/bible/devotionals" },
};
export const revalidate = 600;

const date = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export default async function DevotionalsPage() {
  const list = await listDevotionals();
  return (
    <BibleShell active="devotionals">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight">Daily devotionals</h1>
          <p className="mt-1 text-foreground/70">A word for each day, with a prayer.</p>
          {list.length === 0 ? (
            <p className="mt-8 text-foreground/70">The first devotional is coming soon.</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {list.map((d) => (
                <li key={d.id}>
                  <Link href={`/bible/devotionals/${d.day}`} className="block rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold text-brand-primary-text">{date(d.day)}</p>
                    <p className="mt-1 text-lg font-bold">{d.title}</p>
                    {d.verseRef && <p className="text-sm text-foreground/60">{d.verseRef}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </BibleShell>
  );
}

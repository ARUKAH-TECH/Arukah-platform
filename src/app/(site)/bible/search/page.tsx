import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { BibleShell, SearchBox } from "@/features/bible/BibleShell";
import { chapterHref, parseReference } from "@/lib/bible";
import { searchBible } from "@/server/bible";

export const metadata: Metadata = { title: { absolute: "Search the Bible (KJV) | Repent Online Ministries" }, robots: { index: false } };

function Marked({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const re = new RegExp(`\\b(${words.map((w) => w.replace(/[^a-z0-9']/g, "")).filter(Boolean).join("|")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700/60">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

export default async function SearchPage({ searchParams }: PageProps<"/bible/search">) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 80);

  // "John 3:16" goes straight to the verse.
  const ref = q ? parseReference(q) : null;
  if (ref) redirect(chapterHref(ref.book.slug, ref.chapter, ref.from));

  const { hits, total } = q ? await searchBible(q) : { hits: [], total: 0 };
  const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);

  return (
    <BibleShell active="search">
      <Container>
        <div className="mx-auto max-w-3xl py-10">
          <h1 className="text-3xl font-bold tracking-tight">Search the Bible</h1>
          <p className="mt-1 text-sm text-foreground/60">Type words (e.g. “faith hope love”) or a reference (e.g. “Psalm 23” or “John 3:16”).</p>
          <div className="mt-4">
            <SearchBox q={q} />
          </div>
          {q && (
            <p className="mt-6 text-sm font-semibold">
              {total === 0 ? `No verses found for “${q}”. Try fewer words or the old KJV spelling (e.g. “believeth”).` : `${total} verse${total === 1 ? "" : "s"} found${total > hits.length ? `, showing the first ${hits.length}` : ""}.`}
            </p>
          )}
          <ul className="mt-4 flex flex-col gap-3">
            {hits.map((h) => (
              <li key={`${h.slug}.${h.chapter}.${h.verse}`}>
                <Link href={chapterHref(h.slug, h.chapter, h.verse)} className="block rounded-2xl border border-black/10 bg-white p-4 hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-bold text-brand-primary-text">
                    {h.slug === "psalms" ? "Psalm" : h.book} {h.chapter}:{h.verse}
                  </p>
                  <p className="mt-1 font-serif leading-7">
                    <Marked text={h.text} words={words} />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </BibleShell>
  );
}

import Link from "next/link";
import { chapterHref } from "@/lib/bible";
import { getPassage } from "@/server/bible";

/** Shows the KJV text for references like "John 3:16; Romans 10:9-10" (up to 6). */
export async function Passages({ refs }: { refs: string }) {
  const list = refs
    .split(/[;\n]/)
    .map((r) => r.trim())
    .filter(Boolean)
    .slice(0, 6);
  const passages = (await Promise.all(list.map((r) => getPassage(r)))).filter((p) => p !== null);
  if (!passages.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {passages.map((p) => (
        <blockquote key={p.label} className="rounded-2xl border-l-4 border-brand-primary bg-amber-50 p-4 dark:bg-white/5">
          <p className="font-serif leading-8">
            {p.verses.length > 12 ? (
              <>
                {p.verses
                  .slice(0, 12)
                  .map((v) => `${v.n} ${v.text}`)
                  .join(" ")}{" "}
                …
              </>
            ) : (
              p.verses.map((v) => (
                <span key={v.n}>
                  <sup className="mr-0.5 font-sans text-[0.7em] font-bold text-brand-primary-text">{v.n}</sup>
                  {v.text}{" "}
                </span>
              ))
            )}
          </p>
          <Link href={chapterHref(p.ref.book.slug, p.ref.chapter, p.ref.from)} className="mt-2 inline-block text-sm font-semibold text-brand-primary-text underline">
            {p.label} (KJV) · read the chapter
          </Link>
        </blockquote>
      ))}
    </div>
  );
}

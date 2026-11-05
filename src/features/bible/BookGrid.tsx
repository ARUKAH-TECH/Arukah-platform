import Link from "next/link";
import { BIBLE_BOOKS } from "@/config/bibleBooks";

export function BookGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {(["old", "new"] as const).map((t) => (
        <div key={t}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-primary-text">{t === "old" ? "Old Testament" : "New Testament"}</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BIBLE_BOOKS.filter((b) => b.testament === t).map((b) => (
              <li key={b.slug}>
                <Link
                  href={b.chapters === 1 ? `/bible/${b.slug}/1` : `/bible/${b.slug}`}
                  className="block rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

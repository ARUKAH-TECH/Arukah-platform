import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

// Ministry colours and the small menu shared by every Bible page.
export function BibleShell({ children, active }: { children: ReactNode; active?: "home" | "read" | "devotionals" | "studies" | "topics" | "search" }) {
  const tabs = [
    { id: "home", href: "/bible", label: "🏠 Bible guide home" },
    { id: "read", href: "/bible/books", label: "📖 Bible" },
    { id: "devotionals", href: "/bible/devotionals", label: "🌅 Devotionals" },
    { id: "studies", href: "/bible/studies", label: "🎓 Studies" },
    { id: "topics", href: "/bible/topics", label: "🧭 Topics & questions" },
    { id: "search", href: "/bible/search", label: "🔎 Search" },
  ] as const;
  const current = tabs.find((t) => t.id === active);
  return (
    <div data-brand="ministry">
      <nav aria-label="R.O.M Bible Guide" className="border-b border-black/10 bg-[#14110c] text-white dark:border-white/10">
        <Container>
          {/* Phones: one drop-down menu. (key: closes it after moving to another page) */}
          <details key={active ?? "none"} className="group relative py-2 md:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-full bg-white/10 px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
              <span>
                <span className="font-semibold text-[#f0c050]">📖 R.O.M Bible Guide</span>
                {current && current.id !== "home" && <span className="text-white/80"> · {current.label}</span>}
              </span>
              <span aria-hidden="true" className="text-xs transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="absolute inset-x-0 top-full z-50 mt-1 flex flex-col gap-1 rounded-2xl border border-white/10 bg-[#14110c] p-2 shadow-2xl">
              {tabs.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  aria-current={active === t.id ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 text-base ${active === t.id ? "bg-[#e3a82a] font-semibold text-[#14110c]" : "text-white/90 hover:bg-white/10"}`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </details>
          {/* Computers: the tabs in a row. */}
          <div className="-mx-1 hidden gap-1 py-2 text-sm md:flex">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                aria-current={active === t.id ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 ${active === t.id ? "bg-[#e3a82a] font-semibold text-[#14110c]" : "text-white/80 hover:bg-white/10"}`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </Container>
      </nav>
      {children}
    </div>
  );
}

export function SearchBox({ q = "", dark = false }: { q?: string; dark?: boolean }) {
  return (
    <form action="/bible/search" className="flex w-full max-w-xl gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder="Search: a word, John 3:16 or a question"
        aria-label="Search the Bible"
        className={`min-w-0 flex-1 rounded-full border px-4 py-2.5 text-base ${dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "border-black/15 bg-white dark:border-white/15 dark:bg-zinc-900"}`}
      />
      <button type="submit" className="rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]">
        Search
      </button>
    </form>
  );
}

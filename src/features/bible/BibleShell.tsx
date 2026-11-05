import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

// Ministry colours and the small menu shared by every Bible page.
export function BibleShell({ children, active }: { children: ReactNode; active?: "home" | "read" | "devotionals" | "studies" | "topics" | "search" }) {
  const tabs = [
    { id: "home", href: "/bible", label: "Home" },
    { id: "read", href: "/bible/books", label: "📖 Bible" },
    { id: "devotionals", href: "/bible/devotionals", label: "🌅 Devotionals" },
    { id: "studies", href: "/bible/studies", label: "🎓 Studies" },
    { id: "topics", href: "/bible/topics", label: "🧭 Topics" },
    { id: "search", href: "/bible/search", label: "🔎 Search" },
  ] as const;
  return (
    <div data-brand="ministry">
      <nav aria-label="Bible" className="border-b border-black/10 bg-[#14110c] text-white dark:border-white/10">
        <Container>
          <div className="-mx-1 flex gap-1 overflow-x-auto py-2 text-sm">
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
        placeholder="Search: a word, or John 3:16"
        aria-label="Search the Bible"
        className={`min-w-0 flex-1 rounded-full border px-4 py-2.5 text-base ${dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "border-black/15 bg-white dark:border-white/15 dark:bg-zinc-900"}`}
      />
      <button type="submit" className="rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]">
        Search
      </button>
    </form>
  );
}

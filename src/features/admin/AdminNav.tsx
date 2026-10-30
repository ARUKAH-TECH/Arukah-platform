"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ADMIN_GROUPS } from "@/features/admin/sections";

/**
 * Admin menu: one gold button showing the section you're in. Tap it to drop
 * down every section, grouped. It closes when you pick one, tap outside, or
 * press Escape.
 */
export function AdminNav() {
  const pathname = usePathname();
  // The menu remembers which page it was opened on, so it is closed again after moving to another page.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (o: boolean) => setOpenOn(o ? pathname : null);
  const box = useRef<HTMLDivElement>(null);

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  const current = pathname === "/admin" ? "Dashboard" : ADMIN_GROUPS.flatMap((g) => g.sections).find((s) => active(s.href))?.title ?? "Menu";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const link = (href: string, label: string) => {
    const on = active(href);
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        aria-current={on ? "page" : undefined}
        className={`block rounded-xl px-3 py-2 text-sm ${on ? "bg-[var(--admin-gold)] font-semibold text-[#14110c]" : "text-[#14110c] hover:bg-black/5 dark:text-white dark:hover:bg-white/10"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div ref={box} className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-menu"
          className="flex items-center gap-2 rounded-full bg-[var(--admin-gold)] px-4 py-1.5 text-sm font-semibold text-[#14110c]"
        >
          <span aria-hidden="true">☰</span>
          {current}
          <span aria-hidden="true" className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {pathname !== "/admin" && (
          <Link href="/admin" className="rounded-full px-3 py-1.5 text-sm text-white/85 hover:bg-white/10 hover:text-white">
            ← Dashboard
          </Link>
        )}
      </div>

      {open && (
        <nav
          id="admin-menu"
          aria-label="Admin"
          className="absolute left-0 top-full z-50 mt-2 max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-zinc-900"
        >
          {link("/admin", "🏠 Dashboard")}
          {ADMIN_GROUPS.map((group) => (
            <div key={group.id} className="mt-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">
                <span aria-hidden="true">{group.icon} </span>
                {group.title}
              </p>
              <ul>
                {group.sections.map((s) => (
                  <li key={s.href}>{link(s.href, s.title)}</li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}

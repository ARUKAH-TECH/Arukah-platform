"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Admin menu: scrolls sideways on phones; the current section is highlighted in gold. */
export function AdminNav({ items }: { items: { label: string; href: string }[] }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1.5 text-sm sm:w-auto sm:flex-wrap">
        {items.map((item) => {
          const on = active(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                  on ? "bg-[var(--admin-gold)] font-semibold text-[#14110c]" : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

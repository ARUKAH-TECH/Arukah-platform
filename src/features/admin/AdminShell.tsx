import Link from "next/link";
import { signOut } from "@/features/admin/actions";

const nav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Inbox", href: "/admin/inbox" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Media", href: "/admin/media" },
  { label: "Outreach", href: "/admin/outreach" },
  { label: "Announcements", href: "/admin/announcements" },
  { label: "Advertisers", href: "/admin/advertisers" },
  { label: "Adverts", href: "/admin/ads" },
  { label: "Page text", href: "/admin/pages" },
];

// Rendered only by pages that have already passed requireAdmin().
export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-5">
            <span className="text-sm font-bold tracking-tight">ZIVARUKAH Admin</span>
            <nav aria-label="Admin" className="flex flex-wrap gap-4 text-sm">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-brand-primary-text">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-foreground/60 sm:inline">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}

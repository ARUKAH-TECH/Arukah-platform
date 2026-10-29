import Image from "next/image";
import Link from "next/link";
import { brands } from "@/config/brands";
import { AdminNav } from "@/features/admin/AdminNav";
import { signOut } from "@/features/admin/actions";

const nav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Visitors", href: "/admin/visitors" },
  { label: "Inbox", href: "/admin/inbox" },
  { label: "Literacy comments", href: "/admin/literacy-comments" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Articles", href: "/admin/articles" },
  { label: "Media", href: "/admin/media" },
  { label: "Gallery", href: "/admin/gallery" },
  { label: "Outreach", href: "/admin/outreach" },
  { label: "Announcements", href: "/admin/announcements" },
  { label: "Adverts", href: "/admin/adverts" },
  { label: "Books", href: "/admin/books" },
  { label: "Book orders", href: "/admin/book-orders" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Page text", href: "/admin/pages" },
];

// Rendered only by pages that have already passed requireAdmin().
export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const logo = brands.arukah.logo;
  return (
    <>
      <header className="sticky top-0 z-40 border-b-[3px] border-[var(--admin-gold)] bg-gradient-to-r from-[var(--admin-navy)] to-[var(--admin-blue)] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                <Image src={logo.src} alt="" width={26} height={(26 * logo.height) / logo.width} />
              </span>
              <span className="text-sm font-bold tracking-tight">
                ZIVARUKAH <span className="text-[var(--admin-gold)]">Admin</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-white/70 sm:inline">{email}</span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <AdminNav items={nav} />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </>
  );
}

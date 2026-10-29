import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";
import { InstallAdminApp } from "@/features/admin/AdminApp";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const ready = [
  { title: "Visitors", description: "Graphs of how many people view each page, and where they come from.", href: "/admin/visitors" },
  { title: "Inbox", description: "Messages from the Contact page and the Ministry response form.", href: "/admin/inbox" },
  { title: "Articles", description: "Write, preview, publish and unpublish articles and blog posts.", href: "/admin/articles" },
  { title: "Projects", description: "Create, schedule, publish and archive projects, and choose where they appear.", href: "/admin/projects" },
  { title: "Media library", description: "Upload photos and add YouTube or TikTok links, then attach them to projects.", href: "/admin/media" },
  { title: "Announcements", description: "Banners at the top of chosen pages, with optional start and end times.", href: "/admin/announcements" },
  { title: "Ministry outreach", description: "Hospital, prison, street, community and crusade outreach reports.", href: "/admin/outreach" },
  { title: "Adverts", description: "Approve or reject advert requests, set their dates, and record payment.", href: "/admin/adverts" },
  { title: "Books", description: "Add books with covers, prices per format and a free sample.", href: "/admin/books" },
  { title: "Book orders", description: "Orders from the books basket: payment, printing and delivery.", href: "/admin/book-orders" },
  { title: "Page text", description: "Change the headings and wording on the website's pages.", href: "/admin/pages" },
];

// Sections land here one phase at a time (see docs/EXPANSION-PLAN.md).
const upcoming = ["Support & donations"];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ count: newMessages }, { count: pendingAdvertisers }, { count: newOrders }] = await Promise.all([
    supabase.from("inbox_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("ad_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("book_orders").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const waiting = [
    newMessages ? { label: `${newMessages} new message${newMessages === 1 ? "" : "s"}`, href: "/admin/inbox" } : null,
    pendingAdvertisers
      ? { label: `${pendingAdvertisers} advert request${pendingAdvertisers === 1 ? "" : "s"} to review`, href: "/admin/adverts" }
      : null,
    newOrders ? { label: `${newOrders} new book order${newOrders === 1 ? "" : "s"}`, href: "/admin/book-orders" } : null,
  ].filter((item): item is { label: string; href: string } => item !== null);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <InstallAdminApp />

      {waiting.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {waiting.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
            >
              {item.label} →
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ready.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-black/10 bg-white p-6 hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900"
          >
            <h2 className="text-sm font-semibold">{section.title}</h2>
            <p className="mt-1 text-xs leading-5 text-foreground/60">{section.description}</p>
          </Link>
        ))}
        {upcoming.map((section) => (
          <div
            key={section}
            className="rounded-2xl border border-dashed border-black/15 bg-white p-6 dark:border-white/15 dark:bg-zinc-900"
          >
            <h2 className="text-sm font-semibold">{section}</h2>
            <p className="mt-1 text-xs text-foreground/60">Coming in a later phase</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

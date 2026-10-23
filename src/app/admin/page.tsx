import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { AdminShell } from "@/features/admin/AdminShell";

export const metadata: Metadata = { title: "Dashboard" };

const ready = [
  { title: "Projects", description: "Create, schedule, publish and archive projects, and choose where they appear.", href: "/admin/projects" },
  { title: "Media library", description: "Upload photos and add YouTube or TikTok links, then attach them to projects.", href: "/admin/media" },
  { title: "Announcements", description: "Banners at the top of chosen pages, with optional start and end times.", href: "/admin/announcements" },
  { title: "Ministry outreach", description: "Hospital, prison, street, community and crusade outreach reports.", href: "/admin/outreach" },
  { title: "Page text", description: "Change the headings and wording on the website's pages.", href: "/admin/pages" },
];

// Sections land here one phase at a time (see docs/EXPANSION-PLAN.md).
const upcoming = ["Support & donations", "Books", "Advertising"];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

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
            <p className="mt-1 text-xs text-foreground/50">Coming in a later phase</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

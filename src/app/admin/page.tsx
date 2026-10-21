import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { signOut } from "@/features/admin/actions";

export const metadata: Metadata = { title: "Dashboard" };

// Sections land here one phase at a time (see docs/EXPANSION-PLAN.md).
const upcoming = [
  "Projects & media",
  "Banners & announcements",
  "Ministry outreach",
  "Support & donations",
  "Books",
  "Advertising",
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
            ZIVARUKAH Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-foreground/60">Signed in as {admin.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

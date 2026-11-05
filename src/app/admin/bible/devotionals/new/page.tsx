import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { DevotionalForm } from "@/features/admin/cms/BibleForms";

export const metadata: Metadata = { title: "New devotional" };

export default async function NewDevotionalPage() {
  const admin = await requireAdmin();
  // Suggest the first day without a devotional, from today.
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("bible_devotionals").select("day").gte("day", today).order("day");
  const taken = new Set((data ?? []).map((d) => d.day));
  const day = new Date(`${today}T00:00:00Z`);
  while (taken.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() + 1);
  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/bible" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← Bible app
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New devotional</h1>
      <div className="mt-6 max-w-3xl">
        <DevotionalForm values={{ day: day.toISOString().slice(0, 10), title: "", verseRef: "", body: "", prayer: "", status: "published" }} />
      </div>
    </AdminShell>
  );
}

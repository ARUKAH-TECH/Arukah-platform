import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { updateNursingSignup } from "@/features/admin/cms/nursingActions";

export const metadata: Metadata = { title: "Nursing class" };

type Row = { id: string; school: string; course: string; subject: string; checked: boolean; created_at: string };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" });
}

/** Groups answers that differ only in capitals/spaces, keeping the most common spelling. */
function tally(values: string[]) {
  const groups = new Map<string, { n: number; names: Map<string, number> }>();
  for (const v of values) {
    const name = v.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const g = groups.get(key) ?? { n: 0, names: new Map() };
    g.n += 1;
    g.names.set(name, (g.names.get(name) ?? 0) + 1);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ label: [...g.names.entries()].sort((a, b) => b[1] - a[1])[0][0], n: g.n }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
}

function Bars({ title, items, color }: { title: string; items: { label: string; n: number }[]; color: string }) {
  const max = items[0]?.n ?? 1;
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <h2 className="font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">Nothing yet.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {items.slice(0, 15).map((it, i) => (
            <li key={it.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
              <span className="truncate text-sm">
                {i === 0 && <span aria-hidden="true">🏆 </span>}
                {it.label}
              </span>
              <span className="text-sm font-semibold tabular-nums">{it.n}</span>
              <span className="col-span-2 h-2.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <span className="block h-full rounded-full" style={{ width: `${Math.max(3, (it.n / max) * 100)}%`, background: color }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function NursingClassPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("nursing_signups").select("id, school, course, subject, checked, created_at").order("created_at", { ascending: false }).limit(2000);
  const rows = (data ?? []) as Row[];

  const weekAgo = Date.now() - 7 * 86_400_000;
  const thisWeek = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;
  const unchecked = rows.filter((r) => !r.checked).length;
  // A student may list more than one subject ("Pharmacology, Anatomy"): each is counted.
  const subjects = tally(rows.flatMap((r) => r.subject.split(/[,;/]+/)));
  const courses = tally(rows.map((r) => r.course));
  const schools = tally(rows.map((r) => r.school));

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">🩺 Nursing class sign-ups</h1>
      <p className="mt-1 text-sm text-foreground/60">
        From the free Saturday Zoom class on{" "}
        <Link href="/ziva#nursing" className="underline">
          zivarukah.com/ziva
        </Link>
        . Only school, course and subject are collected (no names or phone numbers). Tick a sign-up once you&apos;ve seen the student in the WhatsApp group.
      </p>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">Sign-ups couldn&apos;t be loaded just now.</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Students signed up", value: rows.length, tone: "bg-[#0b3d91] text-white" },
          { label: "In the last 7 days", value: thisWeek, tone: "bg-[#e3a82a] text-[#14110c]" },
          { label: "Not yet checked", value: unchecked, tone: "bg-black/5 dark:bg-white/10" },
          { label: "Different schools", value: schools.length, tone: "bg-black/5 dark:bg-white/10" },
        ].map((t) => (
          <div key={t.label} className={`rounded-2xl p-4 ${t.tone}`}>
            <p className="text-2xl font-bold tabular-nums">{t.value.toLocaleString()}</p>
            <p className="text-sm opacity-80">{t.label}</p>
          </div>
        ))}
      </div>

      {subjects[0] && (
        <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
          📚 Most needed subject: <strong>{subjects[0].label}</strong> ({subjects[0].n} student{subjects[0].n === 1 ? "" : "s"})
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bars title="Subjects students need help with" items={subjects} color="#0b3d91" />
        <Bars title="Courses" items={courses} color="#e3a82a" />
        <Bars title="Schools" items={schools} color="#25D366" />
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">Every sign-up</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">No sign-ups yet. They appear here as students fill in the form on the ZIVA page.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id} className={`rounded-2xl border p-4 ${r.checked ? "border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900" : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{r.subject}</p>
                    <p className="text-sm text-foreground/70">
                      {r.course} · {r.school}
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">{when(r.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={updateNursingSignup}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="action" value={r.checked ? "uncheck" : "check"} />
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${r.checked ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100" : "bg-[#0b3d91] text-white"}`}
                      >
                        {r.checked ? "✓ Checked" : "Mark checked"}
                      </button>
                    </form>
                    <form action={updateNursingSignup}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="action" value="remove" />
                      <button type="submit" className="rounded-full border border-black/15 px-3 py-1.5 text-xs dark:border-white/20" title="Remove (spam or duplicate)">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

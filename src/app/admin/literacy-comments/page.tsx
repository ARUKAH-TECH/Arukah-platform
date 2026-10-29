import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { moderateLiteracyComment } from "@/features/admin/cms/literacyCommentActions";

export const metadata: Metadata = { title: "Literacy comments" };

const FILTERS = [
  { id: "pending", label: "Waiting" },
  { id: "approved", label: "Approved" },
  { id: "hidden", label: "Hidden" },
];

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" });
}

export default async function LiteracyCommentsPage({ searchParams }: PageProps<"/admin/literacy-comments">) {
  const admin = await requireAdmin();
  const { show } = await searchParams;
  const filter = FILTERS.some((f) => f.id === show) ? (show as string) : "pending";
  const supabase = await createClient();
  const [{ data: rows }, { count: waiting }] = await Promise.all([
    supabase.from("lit_comments").select("id, author, kind, body, status, reply, created_at").eq("status", filter).order("created_at", { ascending: false }).limit(200),
    supabase.from("lit_comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Literacy comments &amp; suggestions</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Sent from learn.zivarukah.com. Nothing is public until you approve it; approved ones show to everyone with the first name only. Your reply
        shows under the comment.
      </p>
      <nav className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/admin/literacy-comments?show=${f.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === f.id ? "bg-foreground text-background" : "bg-black/5 dark:bg-white/10"}`}
          >
            {f.label}
            {f.id === "pending" && (waiting ?? 0) > 0 ? ` (${waiting})` : ""}
          </Link>
        ))}
      </nav>
      <ul className="mt-6 flex flex-col gap-4">
        {(rows ?? []).length === 0 && <li className="text-sm text-foreground/60">Nothing here.</li>}
        {(rows ?? []).map((c) => (
          <li key={c.id} className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs text-foreground/60">
              {c.kind === "suggestion" ? "💡 Suggestion" : "💬 Comment"} · {c.author} · {when(c.created_at)}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            <form action={moderateLiteracyComment} className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="id" value={c.id} />
              <textarea
                name="reply"
                defaultValue={c.reply ?? ""}
                rows={2}
                maxLength={600}
                placeholder="Optional reply (shown under the comment)"
                className="rounded-xl border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
              />
              <div className="flex flex-wrap gap-2">
                {c.status !== "approved" && (
                  <button name="action" value="approve" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                    ✅ Approve
                  </button>
                )}
                {c.status !== "hidden" && (
                  <button name="action" value="hide" className="rounded-full bg-black/10 px-4 py-2 text-sm font-semibold dark:bg-white/15">
                    🙈 Hide
                  </button>
                )}
                <button name="action" value="reply" className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold dark:border-white/20">
                  💬 Save reply
                </button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}

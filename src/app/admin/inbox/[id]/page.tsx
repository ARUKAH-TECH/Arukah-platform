import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { InboxStatusForm } from "@/features/admin/cms/InboxStatusForm";
import { deleteInboxMessage } from "@/features/admin/cms/inboxActions";

export const metadata: Metadata = { title: "Message" };

export default async function InboxMessagePage({ params }: PageProps<"/admin/inbox/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const { data: m } = await supabase
    .from("inbox_messages")
    .select("id, kind, full_name, organization, phone, email, topic, message, status, admin_note, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  const received = new Date(m.created_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Accra" });
  const phoneDigits = m.phone.replace(/[^\d+]/g, "");
  // Ghana numbers like 024… become +233 24… for WhatsApp.
  const whatsapp = phoneDigits.startsWith("+") ? phoneDigits.slice(1) : phoneDigits.startsWith("0") ? `233${phoneDigits.slice(1)}` : phoneDigits;

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/inbox" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← Inbox
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-primary-text">
        {m.kind === "ministry" ? "Ministry response" : "Enquiry"}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{m.full_name}</h1>
      <p className="mt-1 text-sm text-foreground/60">{received}</p>

      <div className="mt-8 grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="flex flex-wrap gap-2">
            {m.phone && (
              <>
                <a href={`tel:${phoneDigits}`} className="rounded-full bg-brand-primary px-4 py-1.5 text-xs font-medium text-brand-on-primary">
                  Call {m.phone}
                </a>
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium dark:border-white/15"
                >
                  WhatsApp
                </a>
              </>
            )}
            {m.email && (
              <a href={`mailto:${m.email}`} className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium dark:border-white/15">
                Email {m.email}
              </a>
            )}
          </div>
          {m.organization && (
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/50">Organisation</p>
              <p className="mt-1">{m.organization}</p>
            </div>
          )}
          {m.topic && (
            <div>
              <p className="text-xs uppercase tracking-wider text-foreground/50">{m.kind === "ministry" ? "Faith journey" : "Service"}</p>
              <p className="mt-1">{m.topic}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground/50">{m.kind === "ministry" ? "Prayer request / message" : "Message"}</p>
            <p className="mt-1 whitespace-pre-line leading-6">{m.message || "—"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <InboxStatusForm id={m.id} status={m.status} adminNote={m.admin_note} />
        </div>
      </div>

      <section className="mt-12 max-w-4xl border-t border-black/10 pt-8 dark:border-white/10">
        <details className="text-sm">
          <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete this message…</summary>
          <p className="mt-2 text-xs text-foreground/60">
            Personal details shouldn&apos;t be kept longer than needed. Delete messages once they&apos;re fully handled.
          </p>
          <form action={deleteInboxMessage} className="mt-3">
            <input type="hidden" name="id" value={m.id} />
            <button type="submit" className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              Delete for good
            </button>
          </form>
        </details>
      </section>
    </AdminShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { MessageButton } from "@/features/admin/cms/ParticipantTools";
import { MESSAGE_KINDS, MESSAGE_LABELS, messageText, waLink, whenText, type MessageKind } from "@/features/programmes/messages";

export const metadata: Metadata = { title: "Message participants" };

// WhatsApp doesn't allow a website to send to many people at once from your own
// number, so this page lists everyone with one button each: tap them one after
// another. Each tap is recorded as "opened" (WhatsApp doesn't report delivery).

export default async function ProgrammeMessagesPage({ params, searchParams }: PageProps<"/admin/programmes/[id]/messages">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { kind: kindParam } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const kind: MessageKind = MESSAGE_KINDS.includes(kindParam as MessageKind) ? (kindParam as MessageKind) : "reminder";
  const supabase = await createClient();
  const [{ data: p }, { data: regs }, { data: notes }] = await Promise.all([
    supabase.from("programmes").select("*").eq("id", id).maybeSingle(),
    supabase.from("programme_registrations").select("id, name, phone, status, payment_status, whatsapp_consent, whatsapp_opt_out").eq("programme_id", id).order("name").limit(5000),
    supabase.from("programme_notifications").select("registration_id, created_at").eq("programme_id", id).eq("kind", kind).order("created_at", { ascending: false }).limit(20000),
  ]);
  if (!p) notFound();
  const programme = {
    title: p.title,
    startsAt: p.starts_at,
    endsAt: p.ends_at,
    timeZone: p.time_zone,
    scheduleNote: p.schedule_note,
    platform: p.platform,
    platformName: p.platform_name,
    priceGhs: Number(p.price_ghs),
  };
  // Who gets this kind of message.
  const all = (regs ?? []).filter((r) => r.whatsapp_consent && !r.whatsapp_opt_out);
  const people = all.filter((r) =>
    kind === "approved"
      ? r.status === "approved"
      : kind === "cancellation"
        ? r.status === "approved" || r.status === "pending"
        : (r.status === "approved" || r.status === "pending") && (r.payment_status === "not_required" || r.payment_status === "paid" || kind === "confirmation"),
  );
  const optedOut = (regs ?? []).filter((r) => r.whatsapp_opt_out).length;
  const lastOpened = new Map<string, string>();
  for (const n of notes ?? []) {
    if (!lastOpened.has(n.registration_id)) {
      lastOpened.set(n.registration_id, new Date(n.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" }));
    }
  }
  const done = people.filter((r) => lastOpened.has(r.id)).length;

  return (
    <AdminShell email={admin.email}>
      <Link href={`/admin/programmes/${id}#participants`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← {p.title}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">💬 Message participants</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {p.title} · {whenText(programme)}
      </p>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        {MESSAGE_KINDS.map((k) => (
          <Link
            key={k}
            href={`/admin/programmes/${id}/messages?kind=${k}`}
            className={`rounded-full border px-3 py-1.5 ${k === kind ? "border-transparent bg-[var(--admin-gold,#e3a82a)] font-semibold text-[#14110c]" : "border-black/10 dark:border-white/10"}`}
          >
            {MESSAGE_LABELS[k]}
          </Link>
        ))}
      </nav>

      <div className="mt-4 max-w-2xl rounded-2xl bg-black/[0.04] p-4 text-sm dark:bg-white/10">
        <p className="text-xs font-semibold uppercase text-foreground/60">The message (example for the first person)</p>
        <p className="mt-2 whitespace-pre-line">{people[0] ? messageText(kind, programme, people[0].name, people[0].payment_status === "paid") : "No one to message."}</p>
      </div>

      <p className="mt-4 text-sm">
        <strong>
          {done} of {people.length}
        </strong>{" "}
        opened. Tap each green button, press send in WhatsApp, then come back for the next one.
        {optedOut > 0 ? ` (${optedOut} who said STOP are left out.)` : ""}
      </p>

      <ul className="mt-4 flex max-w-2xl flex-col gap-2">
        {people.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
            <span className="text-sm">
              <span className="font-semibold">{r.name}</span> <span className="text-foreground/60">{r.phone}</span>
            </span>
            <MessageButton
              registrationId={r.id}
              programmeId={id}
              kind={kind}
              label="Open in WhatsApp"
              opened={lastOpened.get(r.id)}
              href={waLink(r.phone, messageText(kind, programme, r.name, r.payment_status === "paid"))}
            />
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-2xl text-xs text-foreground/60">
        &ldquo;Opened&rdquo; means WhatsApp was opened with the message. The website can&apos;t see whether you pressed send or whether it was delivered.
      </p>
    </AdminShell>
  );
}

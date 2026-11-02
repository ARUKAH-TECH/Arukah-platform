import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteRegistration, revokeRegistrationCode, setOptOut, setRegistrationPayment, setRegistrationStatus } from "@/features/admin/cms/programmeActions";
import { MESSAGE_LABELS, messageText, waLink, type MessageKind, type MessageProgramme } from "@/features/programmes/messages";
import { formatGhs } from "@/config/books";
import { MessageButton, ReissueCode } from "@/features/admin/cms/ParticipantTools";

type Reg = { id: string; name: string; phone: string; status: string; payment_status: string; whatsapp_consent: boolean; whatsapp_opt_out: boolean; created_at: string };
type Note = { registration_id: string; kind: string; created_at: string };
type Pay = { registration_id: string; amount_ghs: number | string; status: string; channel: string; code_delivered: boolean; created_at: string };
type Code = { registration_id: string; expires_at: string; revoked_at: string | null; redeemed_at: string | null; created_at: string };

const STATUS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-black/5 text-foreground/70",
  cancelled: "bg-red-100 text-red-900",
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Accra" });
}

function codeState(c: Code | undefined) {
  if (!c) return "No code";
  if (c.revoked_at) return "Code stopped";
  if (Date.now() >= Date.parse(c.expires_at)) return "Code expired";
  if (c.redeemed_at) return `Code used ${when(c.redeemed_at)}`;
  return "Code not used yet";
}

export async function ProgrammeParticipants({ programmeId, title, capacity, q, programme }: { programmeId: string; title: string; capacity: number | null; q: string; programme: MessageProgramme & { status: string } }) {
  const supabase = await createClient();
  const [{ data: regs }, { data: codes }, { data: pays }, { data: notes }] = await Promise.all([
    supabase.from("programme_registrations").select("id, name, phone, status, payment_status, whatsapp_consent, whatsapp_opt_out, created_at").eq("programme_id", programmeId).order("created_at", { ascending: false }).limit(5000),
    supabase.from("programme_codes").select("registration_id, expires_at, revoked_at, redeemed_at, created_at").eq("programme_id", programmeId).order("created_at", { ascending: false }).limit(10000),
    supabase.from("programme_payments").select("registration_id, amount_ghs, status, channel, code_delivered, created_at").eq("programme_id", programmeId).order("created_at", { ascending: false }).limit(10000),
    supabase.from("programme_notifications").select("registration_id, kind, created_at").eq("programme_id", programmeId).order("created_at", { ascending: false }).limit(20000),
  ]);
  // Latest message of each kind per registration.
  const opened = new Map<string, string>();
  for (const n of (notes ?? []) as Note[]) {
    const key = `${n.registration_id}:${n.kind}`;
    if (!opened.has(key)) opened.set(key, when(n.created_at));
  }
  const lastNote = new Map<string, Note>();
  for (const n of (notes ?? []) as Note[]) if (!lastNote.has(n.registration_id)) lastNote.set(n.registration_id, n);
  // Latest successful (else latest) Paystack payment per registration.
  const payOf = new Map<string, Pay>();
  for (const p of (pays ?? []) as Pay[]) {
    const had = payOf.get(p.registration_id);
    if (!had || (had.status !== "success" && p.status === "success")) payOf.set(p.registration_id, p);
  }
  const all = (regs ?? []) as Reg[];
  // Latest code per registration.
  const latest = new Map<string, Code>();
  for (const c of (codes ?? []) as Code[]) if (!latest.has(c.registration_id)) latest.set(c.registration_id, c);
  const count = (s: string) => all.filter((r) => r.status === s).length;
  const taken = count("pending") + count("approved");
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const shown = needle ? all.filter((r) => r.name.toLowerCase().includes(needle) || (digits.length >= 3 && r.phone.includes(digits))) : all;
  const base = `/admin/programmes/${programmeId}`;

  return (
    <section id="participants" className="mt-12 max-w-3xl scroll-mt-24">
      <h2 className="text-xl font-semibold">👥 Participants</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Approved", value: count("approved"), tone: "bg-green-100 text-green-950" },
          { label: "Waiting", value: count("pending"), tone: "bg-amber-100 text-amber-950" },
          { label: "Places left", value: capacity == null ? "No limit" : Math.max(0, capacity - taken), tone: "bg-[#0b3d91] text-white" },
          { label: "Rejected / cancelled", value: count("rejected") + count("cancelled"), tone: "bg-black/5 dark:bg-white/10" },
        ].map((t) => (
          <div key={t.label} className={`rounded-xl p-3 ${t.tone}`}>
            <p className="text-xl font-bold tabular-nums">{t.value}</p>
            <p className="text-xs opacity-80">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <form action={`${base}#participants`} className="flex flex-1 gap-2">
          <input name="q" defaultValue={q} placeholder="Search name or phone" className="min-w-0 flex-1 rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/15 dark:bg-zinc-900" />
          <button type="submit" className="rounded-full border border-black/15 px-4 py-2 text-sm dark:border-white/15">
            🔍
          </button>
        </form>
        <a href={`${base}/messages`} className="rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-black">
          💬 Message everyone
        </a>
        <a href={`${base}/export`} className="rounded-full bg-[var(--admin-gold,#e3a82a)] px-4 py-2 text-sm font-bold text-[#14110c]">
          ⬇️ Download list (CSV)
        </a>
      </div>
      {needle && (
        <p className="mt-2 text-xs text-foreground/60">
          {shown.length} found ·{" "}
          <Link href={`${base}#participants`} className="underline">
            show all
          </Link>
        </p>
      )}

      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/60">{all.length === 0 ? "No one has registered yet." : "No match."}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {shown.map((r) => {
            const c = latest.get(r.id);
            const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
            const statusButton = (status: string, label: string, cls: string) => (
              <form action={setRegistrationStatus}>
                {hidden("id", r.id)}
                {hidden("programmeId", programmeId)}
                {hidden("status", status)}
                <button type="submit" className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
                  {label}
                </button>
              </form>
            );
            return (
              <li key={r.id} className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[r.status] ?? ""}`}>{r.status}</span>
                  <span className="font-semibold">{r.name}</span>
                  <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#128C7E] underline">
                    {r.phone}
                  </a>
                </div>
                {r.payment_status !== "not_required" && (() => {
                  const pay = payOf.get(r.id);
                  const paid = r.payment_status === "paid";
                  return (
                    <p className={`mt-1 text-xs font-semibold ${paid ? "text-green-800 dark:text-green-300" : "text-amber-800 dark:text-amber-300"}`}>
                      {paid ? "💳 Paid" : `💳 Payment: ${r.payment_status === "pending" ? "not finished" : r.payment_status}`}
                      {pay && paid ? ` ${formatGhs(Number(pay.amount_ghs))}${pay.channel ? ` by ${pay.channel.replace("_", " ")}` : ""}` : ""}
                      {paid && pay && !pay.code_delivered ? " · ⚠️ code not shown to them yet: tap New code and send it on WhatsApp" : ""}
                      {paid && !pay ? " (marked by admin)" : ""}
                    </p>
                  );
                })()}
                <p className="mt-1 text-xs text-foreground/60">
                  Registered {when(r.created_at)} · {codeState(c)}
                  {r.whatsapp_consent ? " · ✅ WhatsApp consent" : ""}
                </p>
                {(() => {
                  const n = lastNote.get(r.id);
                  return n ? (
                    <p className="mt-1 text-xs text-foreground/60">
                      💬 Last WhatsApp: {MESSAGE_LABELS[n.kind as MessageKind] ?? n.kind}, opened {when(n.created_at)} (delivery not confirmed)
                    </p>
                  ) : null;
                })()}
                {r.whatsapp_consent && !r.whatsapp_opt_out && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-[#128C7E]">💬 WhatsApp messages</summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(["confirmation", "approved", "reminder", "change", "cancellation"] as MessageKind[])
                        .filter((k) => (k === "approved" ? r.status === "approved" : k === "cancellation" ? true : r.status !== "rejected" && r.status !== "cancelled"))
                        .map((k) => (
                          <MessageButton
                            key={k}
                            registrationId={r.id}
                            programmeId={programmeId}
                            kind={k}
                            label={MESSAGE_LABELS[k]}
                            opened={opened.get(`${r.id}:${k}`)}
                            href={waLink(r.phone, messageText(k, programme, r.name, r.payment_status === "paid"))}
                          />
                        ))}
                    </div>
                    <p className="mt-1 text-[11px] text-foreground/60">Opens your WhatsApp with the message typed in. You can edit it before sending. To send their code, use 🔄 New code.</p>
                  </details>
                )}
                {r.whatsapp_opt_out && <p className="mt-1 text-xs font-semibold text-red-700 dark:text-red-400">🚫 Asked to stop WhatsApp messages</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={setOptOut}>
                    {hidden("id", r.id)}
                    {hidden("programmeId", programmeId)}
                    {hidden("optOut", r.whatsapp_opt_out ? "false" : "true")}
                    <button type="submit" className="rounded-full border border-black/15 px-3 py-1 text-xs dark:border-white/15">
                      {r.whatsapp_opt_out ? "Allow messages again" : "They said STOP"}
                    </button>
                  </form>
                  {r.status !== "approved" && statusButton("approved", "✓ Approve", "bg-green-700 text-white")}
                  {r.status === "pending" && statusButton("rejected", "✕ Reject", "border border-black/15 dark:border-white/15")}
                  {r.status === "approved" && statusButton("cancelled", "Cancel place", "border border-black/15 dark:border-white/15")}
                  {r.payment_status !== "not_required" && r.payment_status !== "paid" && (
                    <form action={setRegistrationPayment}>
                      {hidden("id", r.id)}
                      {hidden("programmeId", programmeId)}
                      {hidden("payment", "paid")}
                      <button type="submit" className="rounded-full border border-green-700 px-3 py-1 text-xs font-semibold text-green-800 dark:text-green-300">
                        Mark paid (cash / direct MoMo)
                      </button>
                    </form>
                  )}
                  {r.payment_status === "paid" && (
                    <form action={setRegistrationPayment}>
                      {hidden("id", r.id)}
                      {hidden("programmeId", programmeId)}
                      {hidden("payment", "refunded")}
                      <button type="submit" className="rounded-full border border-black/15 px-3 py-1 text-xs dark:border-white/15">
                        Mark refunded
                      </button>
                    </form>
                  )}
                  <ReissueCode id={r.id} programmeId={programmeId} phone={r.phone} name={r.name} title={title} />
                  {c && !c.revoked_at && (
                    <form action={revokeRegistrationCode}>
                      {hidden("id", r.id)}
                      {hidden("programmeId", programmeId)}
                      <button type="submit" className="rounded-full border border-black/15 px-3 py-1 text-xs dark:border-white/15">
                        ⛔ Stop code
                      </button>
                    </form>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-700 dark:text-red-400">Delete…</summary>
                    <form action={deleteRegistration} className="mt-1">
                      {hidden("id", r.id)}
                      {hidden("programmeId", programmeId)}
                      <button type="submit" className="rounded-full bg-red-700 px-3 py-1 text-xs font-medium text-white">
                        Delete for good
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

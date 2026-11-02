import { requireAdmin, audit } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";

// Admin only: the participant list of one programme as a CSV file (opens in Excel or Google Sheets).

function cell(v: unknown) {
  const s = String(v ?? "");
  // Stop spreadsheet formulas sneaking in through a name.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const supabase = await createClient();
  const [{ data: p }, { data: regs }] = await Promise.all([
    supabase.from("programmes").select("slug").eq("id", id).maybeSingle(),
    supabase.from("programme_registrations").select("name, phone, status, payment_status, whatsapp_consent, created_at").eq("programme_id", id).order("created_at").limit(10000),
  ]);
  if (!p) return new Response("Not found", { status: 404 });
  const lines = [
    ["Name", "WhatsApp", "Status", "Payment", "WhatsApp consent", "Registered (Ghana time)"].map(cell).join(","),
    ...(regs ?? []).map((r) =>
      [r.name, r.phone, r.status, r.payment_status, r.whatsapp_consent ? "yes" : "no", new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Africa/Accra" })].map(cell).join(","),
    ),
  ];
  await audit("programme.export", { id, rows: regs?.length ?? 0 });
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${p.slug}-participants.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

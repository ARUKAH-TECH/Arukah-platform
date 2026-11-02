"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { startProgrammePayment } from "@/server/programmePayments";

// Registration and code checks. All rules (places, duplicates, deadlines,
// code expiry and wrong-guess limits) are enforced inside the database.

// Messages written by the database functions are safe to show as they are.
const FRIENDLY = /^(This |Registration |Online payment|Please |Enter |Sorry|Many )/;

export type RegisterResult =
  | { ok: true; code: string; status: "approved" | "pending"; title: string }
  | { ok: true; payUrl: string }
  | { ok: false; message: string };

export async function registerForProgramme(slug: string, name: string, phone: string, consent: boolean): Promise<RegisterResult> {
  const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const { data, error } = await createPublicClient().rpc("programme_register", {
    p_slug: clean(slug, 80),
    p_name: clean(name, 80),
    p_phone: clean(phone, 30),
    p_consent: consent === true,
  });
  if (error || !data) {
    if (error && !FRIENDLY.test(error.message)) console.error("[programmes] register failed", error.message);
    return { ok: false, message: error && FRIENDLY.test(error.message) ? error.message : "Registration couldn't be completed just now. Please try again." };
  }
  revalidatePath("/programmes");
  revalidatePath(`/programmes/${slug}`);
  const d = data as { code?: string; status: "approved" | "pending"; title: string; pay?: boolean; registration?: string; amount?: number };
  if (d.pay && d.registration) {
    // Paid programme: no code yet. It is made only after Paystack confirms the payment.
    const started = await startProgrammePayment(d.registration, Number(d.amount), d.title);
    return started.ok ? { ok: true, payUrl: started.url } : { ok: false, message: started.message };
  }
  return { ok: true, code: d.code ?? "", status: d.status, title: d.title };
}

export type AccessResult =
  | {
      ok: true;
      name: string;
      title: string;
      slug: string;
      startsAt: string;
      endsAt: string;
      timeZone: string;
      scheduleNote: string;
      platform: string;
      platformName: string;
      joinLink: string | null;
      joinInstructions: string;
      singleUse: boolean;
    }
  | { ok: false; reason: string; title?: string };

/** A one-way, daily-changing fingerprint of the visitor's network address, used only to limit wrong guesses. */
async function visitorHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${day}|programme-codes`).digest("hex");
}

export async function checkProgrammeCode(code: string): Promise<AccessResult> {
  const clean = typeof code === "string" ? code.replace(/[^A-Za-z0-9]/g, "").slice(0, 20) : "";
  if (clean.length !== 10) return { ok: false, reason: "invalid" };
  const { data, error } = await createPublicClient().rpc("programme_access", { p_code: clean, p_visitor: await visitorHash() });
  if (error || !data) {
    console.error("[programmes] code check failed", error?.message);
    return { ok: false, reason: "error" };
  }
  const d = data as Record<string, unknown>;
  if (d.ok !== true) return { ok: false, reason: String(d.reason ?? "invalid"), title: typeof d.title === "string" ? d.title : undefined };
  return {
    ok: true,
    name: String(d.name ?? ""),
    title: String(d.title ?? ""),
    slug: String(d.slug ?? ""),
    startsAt: String(d.starts_at),
    endsAt: String(d.ends_at),
    timeZone: String(d.time_zone ?? "Africa/Accra"),
    scheduleNote: String(d.schedule_note ?? ""),
    platform: String(d.platform ?? ""),
    platformName: String(d.platform_name ?? ""),
    joinLink: typeof d.join_link === "string" ? d.join_link : null,
    joinInstructions: String(d.join_instructions ?? ""),
    singleUse: d.single_use === true,
  };
}

export type PaidResult =
  | { state: "paid"; code?: string; title: string; slug: string; approved: boolean }
  | { state: "pending" | "failed" | "unknown" | "refunded" | "cancelled" };

/** Called once by the page Paystack sends the visitor back to. */
export async function collectProgrammeCode(reference: string): Promise<PaidResult> {
  const { confirmProgrammePayment } = await import("@/server/programmePayments");
  return confirmProgrammePayment(typeof reference === "string" ? reference.trim().slice(0, 20) : "", true);
}

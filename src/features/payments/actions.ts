"use server";

import { getPublicOutreaches } from "@/db/outreaches";
import { startBookOrderPayment, startSupportPayment, type StartResult } from "@/server/payments";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function payForBookOrder(orderReference: string, email: string): Promise<StartResult> {
  const ref = String(orderReference).trim().toUpperCase();
  const mail = String(email).trim();
  if (!/^ZB-[A-Z0-9]{6}$/.test(ref)) return { ok: false, message: "That order number doesn't look right." };
  if (!EMAIL.test(mail) || mail.length > 200) return { ok: false, message: "Please enter a valid email for your receipt." };
  return startBookOrderPayment(ref, mail);
}

export async function giveToOutreach(formData: FormData): Promise<StartResult> {
  if (formData.get("company_website")) return { ok: false, message: "Thank you." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const amount = Math.round(Number(String(formData.get("amount") ?? "").replace(/,/g, "")) * 100) / 100;
  const outreachId = String(formData.get("outreachId") ?? "");

  if (!name || name.length > 150) return { ok: false, message: "Please enter your name." };
  if (!EMAIL.test(email) || email.length > 200) return { ok: false, message: "Please enter a valid email for your receipt." };
  if (phone && !/^[+\d][\d\s()-]{5,39}$/.test(phone)) return { ok: false, message: "Please enter a valid phone number." };
  if (message.length > 1000) return { ok: false, message: "Please shorten your message." };
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) {
    return { ok: false, message: "Please enter an amount between GHS 1 and GHS 100,000." };
  }

  let outreach: { id: string; title: string } | null = null;
  if (outreachId) {
    const found = (await getPublicOutreaches(200)).find((o) => o.id === outreachId);
    if (!found) return { ok: false, message: "Please choose an outreach from the list." };
    outreach = { id: found.id, title: found.title };
  }

  return startSupportPayment({
    name,
    email,
    phone,
    message,
    amountGhs: amount,
    outreachId: outreach?.id ?? null,
    outreachTitle: outreach?.title ?? null,
  });
}

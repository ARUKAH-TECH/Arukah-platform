"use server";

import { BOOK_FORMATS, type BookFormat } from "@/config/books";
import { startBookPayment, startGiftPayment, type QuickStart } from "@/server/quickPayments";

export async function payForBook(slug: string, format: string, quantity: number): Promise<QuickStart> {
  if (!/^[a-z0-9-]{1,120}$/.test(String(slug))) return { ok: false, message: "That book isn't available." };
  if (!BOOK_FORMATS.some((f) => f.id === format)) return { ok: false, message: "Please choose a format." };
  return startBookPayment(slug, format as BookFormat, Number(quantity) || 1);
}

export async function giveGift(amount: string, outreachId: string): Promise<QuickStart> {
  const value = Number(String(amount).replace(/,/g, ""));
  const id = /^[0-9a-f-]{36}$/.test(String(outreachId)) ? String(outreachId) : "";
  return startGiftPayment(value, id);
}

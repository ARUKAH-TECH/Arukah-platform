"use server";

import { FORMS_OFF_MESSAGE, ONLINE_FORMS_ENABLED } from "@/config/forms";
import { createPublicClient } from "@/lib/supabase/public";

export interface OrderState {
  status: "idle" | "success" | "error";
  message: string;
  reference?: string;
}

const FORMATS = ["read", "download", "print"];

/**
 * Places the order through the database's place_book_order(), which takes
 * prices from the catalogue and applies the discount itself — the browser's
 * prices are never used. Visitors can't read orders afterwards.
 */
export async function placeBookOrder(formData: FormData): Promise<OrderState> {
  if (!ONLINE_FORMS_ENABLED) return { status: "error", message: FORMS_OFF_MESSAGE };
  if (formData.get("company_website")) return { status: "success", message: "Thank you." };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const fulfilment = String(formData.get("fulfilment") ?? "collection");
  const address = String(formData.get("address") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  let items: { book_id: string; format: string; quantity: number }[] = [];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]")) as { bookId: string; format: string; quantity: number }[];
    items = raw
      .filter((i) => /^[0-9a-f-]{36}$/.test(i.bookId) && FORMATS.includes(i.format))
      .map((i) => ({ book_id: i.bookId, format: i.format, quantity: Math.max(1, Math.min(50, Math.round(Number(i.quantity) || 1))) }));
  } catch {
    items = [];
  }

  if (!name) return { status: "error", message: "Please enter your name." };
  if (!phone && !email) return { status: "error", message: "Please give a phone number or an email so we can reach you." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Please enter a valid email address." };
  if (phone && !/^[+\d][\d\s()-]{5,39}$/.test(phone)) return { status: "error", message: "Please enter a valid phone number." };
  if (fulfilment === "delivery" && !address) return { status: "error", message: "Please enter the delivery address." };
  if (items.length === 0) return { status: "error", message: "Your basket is empty." };
  if (name.length > 150 || email.length > 200 || address.length > 500 || note.length > 1000) {
    return { status: "error", message: "Some answers are too long. Please shorten them." };
  }

  let supabase;
  try {
    supabase = createPublicClient();
  } catch {
    return { status: "error", message: "Orders can't be received right now. Please use the contact page." };
  }

  const { data, error } = await supabase.rpc("place_book_order", {
    customer_name: name,
    phone,
    email,
    fulfilment: fulfilment === "delivery" ? "delivery" : "collection",
    address,
    customer_note: note,
    items,
  });
  if (error || typeof data !== "string") {
    // Messages raised by the database (e.g. "no longer available") are safe to show.
    const known = error?.message && /not available|no longer available|quantity|basket|delivery or collection|several requests|a lot of requests/i.test(error.message);
    console.error("[books] order failed", error?.message);
    return { status: "error", message: known ? error!.message : "Sorry, the order couldn't be placed. Please try again." };
  }

  return { status: "success", message: "Order received.", reference: data };
}

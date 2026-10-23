"use client";

// The visitor's basket lives in their own browser (localStorage). Prices here
// are for display only — the database recalculates every price, and the
// discount, when the order is placed.

import type { BookFormat } from "@/config/books";

export interface BasketItem {
  bookId: string;
  slug: string;
  title: string;
  format: BookFormat;
  formatLabel: string;
  unitPrice: number;
  quantity: number;
}

const KEY = "zivarukah-books-basket";
const EVENT = "zivarukah-basket-change";

export function readBasket(): BasketItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as BasketItem[]) : [];
    return Array.isArray(items) ? items.filter((item) => item && item.bookId && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeBasket(items: BasketItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Storage blocked (private mode etc.) — the basket just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addToBasket(item: BasketItem) {
  const items = readBasket();
  const existing = items.find((i) => i.bookId === item.bookId && i.format === item.format);
  if (existing) existing.quantity = Math.min(50, existing.quantity + item.quantity);
  else items.push(item);
  writeBasket(items);
}

export function onBasketChange(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Mirrors the database rule (display only): 10% off when more than three books. */
export function basketTotals(items: BasketItem[]) {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = count > 3 ? Math.round(subtotal * 10) / 100 : 0;
  return { count, subtotal, discount, total: subtotal - discount };
}

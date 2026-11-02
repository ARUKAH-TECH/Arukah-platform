// How a tap on an advert reaches the advertiser: a WhatsApp chat, a phone
// call, their website (through /ad-click so it is counted), or nothing.

export type AdContactAction = "whatsapp" | "call" | "link" | "none";

/** Ghana numbers to international digits: "024 123 4567" → "233241234567". */
export function intlDigits(phone: string): string {
  const raw = phone.replace(/[^\d+]/g, "");
  if (raw.startsWith("+")) return raw.slice(1);
  if (raw.startsWith("00")) return raw.slice(2);
  if (raw.startsWith("0")) return `233${raw.slice(1)}`;
  return raw;
}

export function isUsablePhone(phone: string) {
  const d = intlDigits(phone);
  return d.length >= 9 && d.length <= 15;
}

export interface AdTarget {
  /** Where a tap goes, or null when the advert isn't tappable. */
  href: string | null;
  /** True for /ad-click (opens a new tab and is counted there); false for tel:/WhatsApp (counted with a beacon). */
  viaClickRoute: boolean;
  /** The number to show on the advert ("" = none). */
  phone: string;
  action: AdContactAction;
}

export function adTarget(ad: { id: string; label: string; linkUrl: string | null; phone: string; action: AdContactAction }): AdTarget {
  const phone = isUsablePhone(ad.phone) ? ad.phone.trim() : "";
  if (ad.action === "whatsapp" && phone) {
    const text = `Hello${ad.label && ad.label !== "Sponsored" ? ` ${ad.label}` : ""}, I saw your advert on zivarukah.com.`;
    return { href: `https://wa.me/${intlDigits(phone)}?text=${encodeURIComponent(text)}`, viaClickRoute: false, phone, action: "whatsapp" };
  }
  if (ad.action === "call" && phone) return { href: `tel:+${intlDigits(phone)}`, viaClickRoute: false, phone, action: "call" };
  if (ad.action === "link" && ad.linkUrl) return { href: `/ad-click/${ad.id}`, viaClickRoute: true, phone, action: "link" };
  // Fall back to whatever still works.
  if (ad.linkUrl) return { href: `/ad-click/${ad.id}`, viaClickRoute: true, phone, action: "link" };
  return { href: null, viaClickRoute: false, phone, action: "none" };
}

/** Counts a click for tel:/WhatsApp taps (the browser leaves the page, so a beacon is used). */
export function countAdClick(id: string) {
  try {
    navigator.sendBeacon(`/ad-click/${id}`);
  } catch {
    // counting must never stop the visitor reaching the advertiser
  }
}

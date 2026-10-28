// Where a visit came from, in plain categories. Only the category is stored.
export const SOURCES = ["direct", "whatsapp", "facebook", "google", "tiktok", "youtube", "instagram", "x", "search", "other"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  direct: "Typed / bookmark / app",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  google: "Google",
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  x: "X (Twitter)",
  search: "Other search engines",
  other: "Other websites",
};

/** Turns a referring address into a category. `ownHost` referrals count as direct. */
export function sourceFromReferrer(referrer: string, ownHost: string, utm?: string | null): Source {
  const tag = (utm ?? "").toLowerCase();
  const tagged = SOURCES.find((s) => s === tag) ?? (tag === "wa" ? "whatsapp" : tag === "fb" ? "facebook" : undefined);
  if (tagged) return tagged;
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (!host || host === ownHost || host.endsWith(`.${ownHost}`)) return "direct";
  if (/whatsapp|wa\.me/.test(host)) return "whatsapp";
  if (/facebook|fb\.(com|me)|messenger/.test(host)) return "facebook";
  if (/(^|\.)google\./.test(host)) return "google";
  if (/tiktok/.test(host)) return "tiktok";
  if (/youtube|youtu\.be/.test(host)) return "youtube";
  if (/instagram/.test(host)) return "instagram";
  if (/(^|\.)(x|twitter|t)\.(com|co)$/.test(host)) return "x";
  if (/bing|yahoo|duckduckgo|yandex|ecosia|brave/.test(host)) return "search";
  return "other";
}

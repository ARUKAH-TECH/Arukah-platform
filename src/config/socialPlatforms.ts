// Recognises a social link from its address, so a new account only needs its
// link: the name, colour and icon are worked out here.

export interface SocialPlatform {
  name: string;
  /** Button colour. */
  color: string;
  /** SVG path (24×24) for the icon, or null for the generic link icon. */
  icon: string | null;
}

const ICONS = {
  facebook: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z",
  youtube: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z",
  tiktok: "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z",
  instagram: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8Zm5.4-9.9a1.2 1.2 0 1 0 0 2.5 1.2 1.2 0 0 0 0-2.5Z",
  x: "M18.9 1.2h3.7l-8 9.2 9.4 12.4h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.2H4.3l13.3 17.4Z",
  linkedin: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5Z",
  whatsapp: "M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm4.5 12c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z",
  telegram: "M23.9 3.6 20.3 20.8c-.3 1.2-1 1.5-2 .9l-5.5-4.1-2.7 2.6c-.3.3-.5.5-1.1.5l.4-5.6 10.2-9.2c.4-.4-.1-.6-.7-.2L6.4 13.6.9 11.9c-1.2-.4-1.2-1.2.3-1.7L22.3 2c1-.4 1.9.2 1.6 1.6Z",
};

const RULES: [RegExp, SocialPlatform][] = [
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, { name: "Facebook", color: "#1877F2", icon: ICONS.facebook }],
  [/(^|\.)(youtube\.com|youtu\.be)$/, { name: "YouTube", color: "#FF0000", icon: ICONS.youtube }],
  [/(^|\.)tiktok\.com$/, { name: "TikTok", color: "#000000", icon: ICONS.tiktok }],
  [/(^|\.)instagram\.com$/, { name: "Instagram", color: "#E1306C", icon: ICONS.instagram }],
  [/(^|\.)(x\.com|twitter\.com)$/, { name: "X (Twitter)", color: "#000000", icon: ICONS.x }],
  [/(^|\.)linkedin\.com$/, { name: "LinkedIn", color: "#0A66C2", icon: ICONS.linkedin }],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, { name: "WhatsApp", color: "#25D366", icon: ICONS.whatsapp }],
  [/(^|\.)(t\.me|telegram\.me)$/, { name: "Telegram", color: "#229ED9", icon: ICONS.telegram }],
  [/(^|\.)threads\.(net|com)$/, { name: "Threads", color: "#000000", icon: null }],
  [/(^|\.)snapchat\.com$/, { name: "Snapchat", color: "#FFFC00", icon: null }],
  [/(^|\.)pinterest\.com$/, { name: "Pinterest", color: "#E60023", icon: null }],
  [/(^|\.)spotify\.com$/, { name: "Spotify", color: "#1DB954", icon: null }],
];

export interface ResolvedSocialLink extends SocialPlatform {
  href: string;
}

/** Turns a list of links into labelled buttons. Bad or non-https links are skipped. */
export function resolveSocialLinks(links: string[]): ResolvedSocialLink[] {
  const out: ResolvedSocialLink[] = [];
  for (const raw of links) {
    let url: URL;
    try {
      url = new URL(raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") continue;
    const host = url.hostname.replace(/^www\.|^m\./, "");
    const rule = RULES.find(([re]) => re.test(host));
    const platform = rule ? rule[1] : { name: host, color: "#6b7280", icon: null };
    out.push({ ...platform, href: url.toString() });
  }
  return out;
}

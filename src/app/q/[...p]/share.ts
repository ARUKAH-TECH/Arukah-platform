import type { CardRequest } from "@/server/shareCard";

// Share links: /q/today/<day> or /q/<book>/<chapter>/<verses>/<version>.
// They show the verse picture as the link preview, then open the homepage.
export function requestFromPath(parts: string[]): CardRequest | null {
  const p = parts.map((x) => decodeURIComponent(x));
  if (p[0] === "today" && p.length <= 2) return { kind: "today" };
  if (p.length === 4) return { kind: "verse", b: p[0], c: p[1], v: p[2].replace(/_/g, ","), t: p[3] };
  return null;
}

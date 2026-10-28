import { createServiceClient, serviceKeyIsServiceRole } from "@/lib/supabase/service";
import { SOURCES, type Source } from "@/features/analytics/sources";

// Counts one page view (daily totals only — see the page_views migration).
// Nothing identifying is stored: no IP, cookie, device or name.

const BOT = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|facebookexternalhit|whatsapp\/|curl|wget|python|node/i;

export async function POST(request: Request) {
  if (BOT.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });
  if (!serviceKeyIsServiceRole()) return new Response(null, { status: 204 });

  let body: { path?: unknown; source?: unknown; visit?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const raw = typeof body.path === "string" ? body.path : "";
  const path = raw.split(/[?#]/)[0].toLowerCase().replace(/\/+$/, "") || "/";
  if (!/^\/[a-z0-9/_-]{0,159}$/.test(path) || /^\/(admin|api)(\/|$)/.test(path)) return new Response(null, { status: 204 });
  const source: Source = SOURCES.includes(body.source as Source) ? (body.source as Source) : "other";
  const visit = body.visit === true;

  const { error } = await createServiceClient().rpc("record_page_view", { p_path: path, p_source: source, p_visit: visit });
  if (error) console.error("[track] failed", error.message);
  return new Response(null, { status: 204 });
}

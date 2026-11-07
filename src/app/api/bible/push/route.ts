import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { pushKeys, validEndpoint } from "@/server/push";

// Turn the R.O.M Bible Guide daily notification on or off for one phone.
// Stores only the browser's push address (no name, number or email).

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 20) return true;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function GET() {
  const keys = await pushKeys();
  if (!keys) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true, publicKey: keys.publicKey }, { headers: { "Cache-Control": "public, max-age=3600" } });
}

const KEY = /^[A-Za-z0-9_-]{80,100}$/;
const AUTH = /^[A-Za-z0-9_-]{16,32}$/;

async function endpointFrom(request: Request) {
  if (limited(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon")) return { error: 429 };
  try {
    const body = (await request.json()) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
    if (!validEndpoint(body.endpoint)) return { error: 400 };
    // The phone's public keys, so the notification text can travel inside the push.
    const p256dh = typeof body.keys?.p256dh === "string" && KEY.test(body.keys.p256dh) ? body.keys.p256dh : null;
    const auth = typeof body.keys?.auth === "string" && AUTH.test(body.keys.auth) ? body.keys.auth : null;
    return { endpoint: body.endpoint, p256dh, auth };
  } catch {
    return { error: 400 };
  }
}

export async function POST(request: Request) {
  const { endpoint, p256dh, auth, error } = await endpointFrom(request);
  if (!endpoint) return NextResponse.json({ ok: false }, { status: error });
  const row: { endpoint: string; p256dh?: string; auth?: string } = p256dh && auth ? { endpoint, p256dh, auth } : { endpoint };
  const { error: dbError } = await createServiceClient().from("bible_push").upsert(row, { onConflict: "endpoint" });
  return NextResponse.json({ ok: !dbError }, { status: dbError ? 500 : 200 });
}

export async function DELETE(request: Request) {
  const { endpoint, error } = await endpointFrom(request);
  if (!endpoint) return NextResponse.json({ ok: false }, { status: error });
  await createServiceClient().from("bible_push").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}

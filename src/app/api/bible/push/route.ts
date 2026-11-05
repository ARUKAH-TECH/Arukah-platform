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

async function endpointFrom(request: Request) {
  if (limited(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon")) return { error: 429 };
  try {
    const body = (await request.json()) as { endpoint?: unknown };
    return validEndpoint(body.endpoint) ? { endpoint: body.endpoint } : { error: 400 };
  } catch {
    return { error: 400 };
  }
}

export async function POST(request: Request) {
  const { endpoint, error } = await endpointFrom(request);
  if (!endpoint) return NextResponse.json({ ok: false }, { status: error });
  const { error: dbError } = await createServiceClient().from("bible_push").upsert({ endpoint }, { onConflict: "endpoint", ignoreDuplicates: true });
  return NextResponse.json({ ok: !dbError }, { status: dbError ? 500 : 200 });
}

export async function DELETE(request: Request) {
  const { endpoint, error } = await endpointFrom(request);
  if (!endpoint) return NextResponse.json({ ok: false }, { status: error });
  await createServiceClient().from("bible_push").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}

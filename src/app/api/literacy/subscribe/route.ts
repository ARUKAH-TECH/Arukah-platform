import { startSubscription } from "@/server/literacySubs";

// learn.zivarukah.com → POST { reference } → { ok, url } (Paystack page).
const ALLOWED = new Set(["https://learn.zivarukah.com", "https://ziva-literacy-coach-arukah-tech.vercel.app"]);

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED.has(origin) ? origin : "https://learn.zivarukah.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED.has(origin)) return Response.json({ ok: false, message: "Not allowed." }, { status: 403, headers: cors(origin) });
  let reference = "";
  try {
    reference = String(((await request.json()) as { reference?: unknown }).reference ?? "");
  } catch {
    // bad body
  }
  const result = await startSubscription(reference);
  return Response.json(result, { status: result.ok ? 200 : 400, headers: cors(origin) });
}

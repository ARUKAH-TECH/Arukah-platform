// AI handwriting check for the ZIVA Literacy app (learn.zivarukah.com).
//
// Privacy (children): the photo is passed straight to the AI service to read
// it and is NOT stored here — no database row, no file, no log of the image.
// The app only calls this after a parent/teacher ticks consent.
// The AI is told to give friendly writing feedback only and never to suggest
// any learning difficulty or diagnosis.

export const maxDuration = 60;

const ALLOWED_ORIGINS = new Set([
  "https://learn.zivarukah.com",
  "https://ziva-literacy-coach-arukah-tech.vercel.app",
]);
const MODEL = process.env.FAL_VISION_MODEL || "google/gemini-2.5-flash";
const ENDPOINT = "https://fal.run/openrouter/router/vision";
const MAX_IMAGE_CHARS = 2_500_000; // ≈ 1.8 MB JPEG as base64

// Small per-instance limiter so one phone can't run up costs.
const hits = new Map<string, number[]>();
function limited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 12) return true;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://learn.zivarukah.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

function reply(origin: string | null, body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors(origin) });
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
const list = (v: unknown, max: number, n: number) => (Array.isArray(v) ? v.map((x) => clip(x, n)).filter(Boolean).slice(0, max) : []);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return reply(origin, { ok: false, message: "Not allowed." }, 403);
  if (!process.env.FAL_KEY?.trim()) return reply(origin, { ok: false, message: "The AI check is not switched on yet." }, 503);

  const who = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (limited(who)) return reply(origin, { ok: false, message: "Lots of checks just now: please wait a few minutes and try again." }, 429);

  let body: { image?: unknown; target?: unknown; level?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply(origin, { ok: false, message: "Bad request." }, 400);
  }
  const image = typeof body.image === "string" ? body.image : "";
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > MAX_IMAGE_CHARS) {
    return reply(origin, { ok: false, message: "Please send a smaller, clear photo." }, 400);
  }
  const target = clip(body.target, 160);
  const level = clip(body.level, 20) || "primary";

  const system = [
    "You are a kind handwriting coach for children in Ghana (Kindergarten to JHS) using the ZIVA Literacy app.",
    "Look at the photo of handwriting on paper. Compare it with the exercise text if one is given.",
    "Give short, encouraging, practical feedback a child and parent can act on.",
    "Never mention or suggest any learning difficulty, disability, condition or diagnosis (e.g. dyslexia, dysgraphia). Only talk about the writing itself.",
    "Do not describe the child or anything else in the photo except the writing.",
    'Reply with JSON only, no markdown, exactly this shape: {"read_text": string, "matches_target": boolean, "stars": integer 1-5, "summary": string, "letters": [{"letter": string, "issue": string, "tip": string}], "strengths": [string], "next_steps": [string]}.',
    "read_text = an EXACT copy of what the child actually wrote, character by character, so the app can rewrite it and mark corrections: keep their spelling mistakes, reversed letters (write b if they wrote b), capital and small letters exactly as written, missing or extra punctuation, and joined words (no space if they left no space). Do NOT correct anything in read_text and do NOT copy the exercise text unless that is exactly what was written. If a letter is unclear, write your best guess of what it looks like. If the same word or letter is written several times, include every copy separated by spaces.",
    "letters = up to 5 specific letters/words that are wrong, reversed (b/d, p/q), badly formed, the wrong size, or missing compared with the exercise. Use simple English.",
    "If there is no readable handwriting in the photo, set read_text to \"\" and explain kindly in summary how to take a better photo.",
  ].join(" ");
  const prompt = `Exercise text the child was asked to write: ${target ? `"${target}"` : "(not given: just assess the writing)"}. Class level: ${level}.`;

  let output = "";
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Key ${process.env.FAL_KEY.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, system_prompt: system, prompt, image_urls: [image], temperature: 0.2, max_tokens: 900 }),
      signal: AbortSignal.timeout(50_000),
    });
    if (!res.ok) {
      console.error("[literacy-ai] upstream", res.status);
      return reply(origin, { ok: false, message: "The AI checker is busy. Please try again shortly." }, 502);
    }
    const data = (await res.json()) as { output?: string };
    output = data.output ?? "";
  } catch (error) {
    console.error("[literacy-ai] failed", error instanceof Error ? error.name : "error");
    return reply(origin, { ok: false, message: "The AI checker didn't answer. Please try again." }, 502);
  }

  let parsed: Record<string, unknown> = {};
  try {
    const json = output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1);
    parsed = JSON.parse(json);
  } catch {
    return reply(origin, { ok: false, message: "The AI checker gave an unclear answer. Please try again." }, 502);
  }
  const stars = Math.max(1, Math.min(5, Math.round(Number(parsed.stars) || 3)));
  const letters = Array.isArray(parsed.letters)
    ? parsed.letters
        .slice(0, 5)
        .map((l) => {
          const o = (l ?? {}) as Record<string, unknown>;
          return { letter: clip(o.letter, 30), issue: clip(o.issue, 140), tip: clip(o.tip, 180) };
        })
        .filter((l) => l.letter || l.issue)
    : [];
  return reply(origin, {
    ok: true,
    readText: clip(parsed.read_text, 300),
    matchesTarget: parsed.matches_target === true,
    stars,
    summary: clip(parsed.summary, 300),
    letters,
    strengths: list(parsed.strengths, 4, 160),
    nextSteps: list(parsed.next_steps, 4, 180),
  });
}

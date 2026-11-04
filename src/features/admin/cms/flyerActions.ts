"use server";

import { requireAdmin } from "@/server/auth";
import { mediaPublicUrl } from "@/lib/supabase/public";

// Reads an uploaded programme flyer with AI (fal.ai, the same service as the
// literacy handwriting check, using FAL_KEY) and returns the details printed
// on it, so the admin only has to check them and save. Nothing is saved here,
// and nothing on the flyer is guessed: anything not printed comes back empty.

const ENDPOINT = "https://fal.run/openrouter/router/vision";
const MODEL = process.env.FAL_VISION_MODEL || "google/gemini-2.5-flash";
const PATH = /^programmes\/[0-9a-f-]{36}\.webp$/;

export interface FlyerDetails {
  title: string;
  category: string;
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD or ""
  endDate: string;
  startTime: string; // HH:MM (24h) or ""
  endTime: string;
  scheduleNote: string;
  platform: "zoom" | "google_meet" | "teams" | "other" | "";
  platformName: string;
  priceGhs: number;
  yearShown: boolean;
}

export type FlyerResult = { ok: true; details: FlyerDetails } | { ok: false; message: string };

const hits: number[] = [];

const clip = (v: unknown, max: number) =>
  (typeof v === "string" ? v : "")
    .replace(/(\+?\d[\d\s-]{8,}\d)/g, "") // never copy phone numbers onto the website
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
const time = (v: unknown) => (typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : "");

export async function readFlyer(imagePath: string): Promise<FlyerResult> {
  await requireAdmin();
  if (!PATH.test(imagePath)) return { ok: false, message: "Upload the flyer first." };
  if (!process.env.FAL_KEY?.trim()) return { ok: false, message: "The AI reader is not switched on (FAL_KEY is missing in Vercel)." };

  const now = Date.now();
  while (hits.length && now - hits[0] > 10 * 60_000) hits.shift();
  if (hits.length >= 20) return { ok: false, message: "Many flyers read just now. Please wait a few minutes." };
  hits.push(now);

  const today = new Date().toISOString().slice(0, 10);
  const system = `You read event flyers for a Ghanaian ministry and education website and return ONLY a JSON object, no other text.
Copy only what is printed on the flyer. If something is not printed, use "" (or 0 for price, false for yearShown). Never invent dates, times, places, prices or names.
Fields:
- title: the programme's main title, in normal Title Case (not ALL CAPS).
- category: one or two words, e.g. "Ministry", "Prayer", "Bible study", "Nursing", "Tech training", "Book launch".
- summary: one short sentence (max 25 words) saying what the programme is, from the flyer.
- description: 2 to 4 short sentences from the flyer: theme, Bible verse, speakers or ministers and their titles, what to expect. Plain sentences, no emojis, no phone numbers, no links.
- startDate, endDate: "YYYY-MM-DD". For a multi-day programme, the first and last day. If the flyer shows no year, use the year that makes the date closest to ${today} and set yearShown false.
- startTime, endTime: 24-hour "HH:MM" (e.g. 9pm = "21:00"). Use the daily start and end time.
- scheduleNote: only if it repeats or runs over several days, e.g. "27th to 29th November 2026, every evening" or "Every Saturday". Otherwise "".
- platform: "zoom", "google_meet", "teams", or "other" (Facebook Live, YouTube, WhatsApp, TikTok, a physical place...). "" if not shown.
- platformName: when platform is "other", the name shown, e.g. "Facebook Live" or the venue. Otherwise "".
- priceGhs: the fee in Ghana cedis as a number, 0 if free or not shown.
- yearShown: true only if the year is printed on the flyer.`;

  let output = "";
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Key ${process.env.FAL_KEY.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        system_prompt: system,
        prompt: "Read this flyer and return the JSON.",
        image_urls: [mediaPublicUrl(imagePath.replace(/\.webp$/, ".jpg"))],
        temperature: 0.1,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(50_000),
    });
    if (!res.ok) {
      console.error("[flyer-ai] upstream", res.status);
      return { ok: false, message: "The AI reader is busy. Please try again shortly." };
    }
    output = ((await res.json()) as { output?: string }).output ?? "";
  } catch (error) {
    console.error("[flyer-ai] failed", error instanceof Error ? error.name : "error");
    return { ok: false, message: "The AI reader didn't answer. Please try again." };
  }

  let o: Record<string, unknown>;
  try {
    o = JSON.parse(output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1));
  } catch {
    return { ok: false, message: "The flyer couldn't be read clearly. Please fill in the details yourself." };
  }

  const platform = ["zoom", "google_meet", "teams", "other"].includes(String(o.platform)) ? (String(o.platform) as FlyerDetails["platform"]) : "";
  const startDate = day(o.startDate);
  const price = Number(o.priceGhs);
  return {
    ok: true,
    details: {
      title: clip(o.title, 140),
      category: clip(o.category, 60),
      summary: clip(o.summary, 300),
      description: clip(o.description, 1500),
      startDate,
      endDate: day(o.endDate) || startDate,
      startTime: time(o.startTime),
      endTime: time(o.endTime),
      scheduleNote: clip(o.scheduleNote, 120),
      platform,
      platformName: platform === "other" ? clip(o.platformName, 60) : "",
      priceGhs: Number.isFinite(price) && price > 0 && price < 100000 ? Math.round(price * 100) / 100 : 0,
      yearShown: o.yearShown === true,
    },
  };
}

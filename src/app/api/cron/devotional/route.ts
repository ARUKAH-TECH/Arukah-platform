import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runDailyDevotional, themesFor, writeDevotional } from "@/server/bibleAuto";
import { todayInGhana } from "@/server/bible";
import { sendDailyNotification } from "@/server/push";

// Called by Vercel Cron at 6:00am Ghana time (vercel.json). If no devotional
// was published for today, it writes one on the year's and month's themes.
// Safe to call more than once: it never makes a second devotional for a day,
// and does nothing before 6:00am. It also sends the daily notification. With CRON_SECRET set in Vercel, only
// Vercel's own scheduler can call it.

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const url = new URL(request.url);

  // Test run (nothing saved): needs the one-time key stored in the database.
  if (url.searchParams.get("dry") === "1") {
    const key = url.searchParams.get("key") ?? "";
    const client = createServiceClient();
    const { data } = await client.from("bible_settings").select("value").eq("key", "test_key").maybeSingle();
    if (!data?.value || data.value.length < 20 || data.value !== key) return NextResponse.json({ ok: false }, { status: 403 });
    const day = todayInGhana();
    const draft = await writeDevotional(day, await themesFor(day, client));
    return NextResponse.json({ ok: Boolean(draft), draft });
  }

  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await runDailyDevotional();
  // Then the daily notification to phones that asked for it (once a day).
  const notification = await sendDailyNotification().catch(() => ({ status: "error" }));
  return NextResponse.json({ ok: true, ...result, notification });
}

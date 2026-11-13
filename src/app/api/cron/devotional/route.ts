import { after, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runDailyDevotional, themesFor, writeDevotional } from "@/server/bibleAuto";
import { todayInGhana } from "@/server/bible";
import { sendDailyNotification } from "@/server/push";

// The daily schedule (Ghana time = UTC), called on the minute by the database
// scheduler (pg_cron) and again by Vercel Cron as a backup (vercel.json):
//   5:30am  ?step=write  if the owner hasn't published today's devotional by
//                        5:00am, write one on the year's and month's themes;
//   6:00am  (no step)    write one if still missing, then send the notification.
// Safe to call more than once: never a second devotional or notification for a day.
// If CRON_SECRET is set in Vercel, calls must carry it (update the pg_cron jobs too).

// The free AI can be slow: the work runs in the background (after the reply),
// so the scheduler's 60-second wait never cuts it short.
export const maxDuration = 300;
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
  const writeOnly = url.searchParams.get("step") === "write";
  after(async () => {
    const writing = runDailyDevotional().catch((error) => {
      console.error("[devotional] write failed", error instanceof Error ? error.message : "error");
      return { status: "error" };
    });
    if (writeOnly) {
      console.log("[devotional] write", JSON.stringify(await writing));
      return;
    }
    // The notification never waits more than 90 s for a devotional: if the AI is
    // still busy it goes out with the verse of the day (the devotional follows on the site).
    const written = await Promise.race([writing, new Promise((resolve) => setTimeout(() => resolve({ status: "still-writing" }), 90_000))]);
    const notification = await sendDailyNotification().catch(() => ({ status: "error" }));
    console.log("[devotional] daily", JSON.stringify({ written, notification }));
    await writing; // let a slow write finish
  });
  return NextResponse.json({ ok: true, started: writeOnly ? "write" : "write+notify" });
}

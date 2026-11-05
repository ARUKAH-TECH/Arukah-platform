import { NextResponse } from "next/server";
import { todaysNotification } from "@/server/push";

// What the daily notification shows: today's devotional with its scripture,
// or the verse of the day. Public content only.

export const dynamic = "force-dynamic";

export async function GET() {
  const note = await todaysNotification();
  return NextResponse.json({ title: note.title, body: note.body, url: note.url }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}

import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

// /ad-click/<advert id>: counts a click, then sends the visitor on to the
// advertiser's link. Only works while the advert is live; otherwise it goes
// to the homepage. The link always comes from the database, never from the
// address, so this can't be used to send people to arbitrary websites.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const home = new URL("/", request.url);
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.redirect(home, 302);

  let supabase;
  try {
    supabase = createPublicClient();
  } catch {
    return NextResponse.redirect(home, 302);
  }

  const { data: link } = await supabase.rpc("live_ad_link", { ad: id });
  if (typeof link !== "string" || !link.startsWith("https://")) return NextResponse.redirect(home, 302);

  // Counting must never stop the visitor reaching the advertiser.
  const { error } = await supabase.rpc("record_ad_event", { ad: id, kind: "click" });
  if (error) console.error("[ads] click count failed", error.message);

  return NextResponse.redirect(link, { status: 302, headers: { "Cache-Control": "no-store" } });
}

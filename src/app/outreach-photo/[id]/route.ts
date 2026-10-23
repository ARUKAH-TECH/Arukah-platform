import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

// Public address for an outreach photo: /outreach-photo/<media id>.
//
// The file lives in a PRIVATE bucket. This asks the database — as an
// anonymous visitor — for the item; Row Level Security only returns it when
// the outreach is published and the photo's consent is cleared. Only then is
// a short-lived signed link made and the browser redirected to it. Anything
// else is a plain 404, so hidden photos can't be found by guessing.

const SIGNED_LINK_SECONDS = 60 * 60;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });

  let supabase;
  try {
    supabase = createPublicClient();
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: item } = await supabase
    .from("outreach_media")
    .select("storage_path")
    .eq("id", id)
    .eq("kind", "image")
    .maybeSingle();
  if (!item?.storage_path) return new NextResponse("Not found", { status: 404 });

  const { data: signed } = await supabase.storage
    .from("outreach-media")
    .createSignedUrl(item.storage_path, SIGNED_LINK_SECONDS);
  if (!signed?.signedUrl) return new NextResponse("Not found", { status: 404 });

  // Cached briefly (well inside the link's lifetime) so a withdrawn photo
  // stops being served within minutes.
  return NextResponse.redirect(signed.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
}

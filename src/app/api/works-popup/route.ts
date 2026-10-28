import { getHouseAds, getPopupWindow, HOUSE_SECONDS } from "@/features/ads/houseAds";

// Asked by the browser a few seconds after a page opens: is the "our works"
// pop-up on right now (the 48 hours after 5 days with no paid advert)?
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // ?preview=1 shows it now (for checking the design), whatever the schedule.
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const { active, endsAt } = preview ? { active: true, endsAt: Date.now() + 3_600_000 } : await getPopupWindow();
  if (!active || !endsAt) return Response.json({ active: false }, { headers: { "Cache-Control": "no-store" } });
  const ads = await getHouseAds();
  return Response.json({ active: ads.length > 0, endsAt, seconds: HOUSE_SECONDS, ads }, { headers: { "Cache-Control": "no-store" } });
}

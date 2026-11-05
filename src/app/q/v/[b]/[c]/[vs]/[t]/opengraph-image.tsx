import { CARD_SIZES } from "@/server/shareCard";

export const size = CARD_SIZES.wide;
export const contentType = "image/png";
export const alt = "A Bible verse from R.O.M Bible Guide, Repent Online Ministries";
import { sharedImage, verseRequest } from "@/app/q/shared";

export default async function Image({ params }: { params: Promise<{ b: string; c: string; vs: string; t: string }> }) {
  return sharedImage(verseRequest(await params));
}

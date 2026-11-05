import { CARD_SIZES } from "@/server/shareCard";

export const size = CARD_SIZES.wide;
export const contentType = "image/jpeg";
export const alt = "A Bible verse from R.O.M Bible Guide, Repent Online Ministries";
import { sharedImage } from "@/app/q/shared";

export const revalidate = 1800;

export default async function Image() {
  return sharedImage({ kind: "today" });
}

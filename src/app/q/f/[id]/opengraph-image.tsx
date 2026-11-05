import { CARD_SIZES } from "@/server/shareCard";
import { sharedImage } from "@/app/q/shared";

export const size = CARD_SIZES.wide;
export const contentType = "image/jpeg";
export const alt = "A word from Shepherd Justice Sarpong Oduro, Repent Online Ministries";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  return sharedImage({ kind: "founder", id: (await params).id });
}

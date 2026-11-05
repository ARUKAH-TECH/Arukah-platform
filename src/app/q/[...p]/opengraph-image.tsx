import { cardContent, renderCard, CARD_SIZES } from "@/server/shareCard";
import { requestFromPath } from "./share";

// The link preview picture: the verse with the R.O.M Bible Guide logo.
export const size = CARD_SIZES.wide;
export const contentType = "image/png";
export const alt = "A Bible verse from R.O.M Bible Guide, Repent Online Ministries";

export default async function Image({ params }: { params: Promise<{ p: string[] }> }) {
  const req = requestFromPath((await params).p);
  const content = (req && (await cardContent(req))) || { text: "Thy word is a lamp unto my feet, and a light unto my path.", source: "Psalm 119:105 (KJV)", ministry: true };
  return renderCard(content, "wide");
}

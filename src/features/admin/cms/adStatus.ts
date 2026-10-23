// Shared by the admin list and editor: the plan's advert lifecycle, worked
// out from the three approvals and the dates (nothing extra is stored).

export const AD_BRANCHES = [
  { id: "home", label: "Homepage" },
  { id: "tech", label: "ARUKAH TECH" },
  { id: "wear", label: "ARUKAH WEAR" },
  { id: "ziva", label: "ZIVA Special Classes" },
  { id: "media", label: "ARUKAH MEDIA" },
  { id: "books", label: "ZIVARUKAH BOOKS" },
] as const;

export const AD_BRANCH_IDS: readonly string[] = AD_BRANCHES.map((branch) => branch.id);

export interface AdStatusInput {
  advertiserStatus: string;
  contentStatus: string;
  paymentConfirmed: boolean;
  startsOn: string;
  endsOn: string;
}

export interface AdStatus {
  label: string;
  tone: "live" | "waiting" | "scheduled" | "ended" | "rejected";
  missing: string[];
}

/** Today's date in Ghana (GMT all year), as YYYY-MM-DD. */
export function todayInGhana() {
  return new Date().toISOString().slice(0, 10);
}

export function adStatus(input: AdStatusInput): AdStatus {
  if (input.contentStatus === "rejected") return { label: "Rejected", tone: "rejected", missing: [] };
  if (input.advertiserStatus === "rejected") return { label: "Advertiser rejected", tone: "rejected", missing: [] };

  const missing: string[] = [];
  if (input.advertiserStatus !== "approved") missing.push("advertiser approval");
  if (input.contentStatus !== "approved") missing.push("content approval");
  if (!input.paymentConfirmed) missing.push("payment confirmation");
  if (missing.length > 0) return { label: "Pending review", tone: "waiting", missing };

  const today = todayInGhana();
  if (today < input.startsOn) return { label: "Scheduled", tone: "scheduled", missing: [] };
  if (today > input.endsOn) return { label: "Expired", tone: "ended", missing: [] };
  return { label: "Live", tone: "live", missing: [] };
}

export const AD_TONE_CLASSES: Record<AdStatus["tone"], string> = {
  live: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  waiting: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  scheduled: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  ended: "bg-black/5 text-foreground/60 dark:bg-white/10",
  rejected: "bg-black/5 text-foreground/50 dark:bg-white/10",
};

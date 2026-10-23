// Outreach types for Repent Online Ministries. Must match the check in
// supabase/migrations/20261023030000_outreaches.sql.
export const OUTREACH_TYPES = [
  { id: "hospital", label: "Hospital outreach", needsFacilityPermission: true },
  { id: "prison", label: "Prison outreach", needsFacilityPermission: true },
  { id: "street", label: "Street outreach", needsFacilityPermission: false },
  { id: "community", label: "Community outreach", needsFacilityPermission: false },
  { id: "crusade", label: "Crusade", needsFacilityPermission: false },
  { id: "other", label: "Other outreach", needsFacilityPermission: false },
] as const;

export type OutreachType = (typeof OUTREACH_TYPES)[number]["id"];

export const OUTREACH_TYPE_IDS: readonly string[] = OUTREACH_TYPES.map((type) => type.id);

export function outreachTypeLabel(id: string) {
  return OUTREACH_TYPES.find((type) => type.id === id)?.label ?? "Outreach";
}

export function needsFacilityPermission(id: string) {
  return OUTREACH_TYPES.find((type) => type.id === id)?.needsFacilityPermission ?? false;
}

/** "26 October 2024" — dates are calendar dates, shown without a time zone shift. */
export function formatOutreachDate(date: string | null) {
  if (!date) return "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

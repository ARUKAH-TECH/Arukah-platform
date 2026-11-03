// Online Programmes: shared labels and time-zone helpers (used by Admin now,
// and by the public pages in the next step).

export const PROGRAMME_STATUSES = ["draft", "published", "closed", "completed", "cancelled"] as const;
export type ProgrammeStatus = (typeof PROGRAMME_STATUSES)[number];

export const PROGRAMME_STATUS_LABELS: Record<ProgrammeStatus, string> = {
  draft: "Draft (hidden)",
  published: "Published (open for registration)",
  closed: "Registration closed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PLATFORMS = ["zoom", "google_meet", "teams", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  teams: "Microsoft Teams",
  other: "Other",
};

export function platformName(platform: string, custom: string) {
  return platform === "other" ? custom || "Online" : (PLATFORM_LABELS[platform as Platform] ?? "Online");
}

/** Time zones offered in Admin (most participants are in Ghana). */
export const TIME_ZONES = [
  { id: "Africa/Accra", label: "Ghana (GMT)" },
  { id: "Africa/Lagos", label: "Nigeria (WAT, GMT+1)" },
  { id: "Europe/London", label: "United Kingdom" },
  { id: "Europe/Berlin", label: "Central Europe" },
  { id: "America/New_York", label: "US Eastern" },
  { id: "America/Chicago", label: "US Central" },
  { id: "America/Los_Angeles", label: "US Pacific" },
  { id: "Asia/Dubai", label: "UAE (GST)" },
] as const;

export function isTimeZone(tz: string) {
  return TIME_ZONES.some((z) => z.id === tz);
}

/** Milliseconds the time zone is ahead of UTC at that moment. */
function offsetMs(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second) - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-11-07T15:00" typed in Admin, read as that zone's local time → ISO (UTC). */
export function zonedInputToIso(value: string, tz: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const guess = Date.parse(`${value}:00Z`);
  if (Number.isNaN(guess)) return null;
  const first = offsetMs(new Date(guess), tz);
  let t = guess - first;
  const second = offsetMs(new Date(t), tz);
  if (second !== first) t = guess - second;
  return new Date(t).toISOString();
}

/** ISO (UTC) → "2026-11-07T15:00" in that zone, for the Admin date inputs. */
export function isoToZonedInput(iso: string | null, tz: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() + offsetMs(d, tz)).toISOString().slice(0, 16);
}

/** "Sat 7 Nov 2026, 3:00pm" in the programme's zone. */
export function formatWhen(iso: string, tz: string) {
  return new Date(iso)
    .toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })
    .replace(" am", "am")
    .replace(" pm", "pm");
}

export function formatTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).replace(" am", "am").replace(" pm", "pm");
}

export const LINK_RELEASES = ["always", "3_days", "day_of", "1_hour"] as const;
export type LinkRelease = (typeof LINK_RELEASES)[number];

export const LINK_RELEASE_LABELS: Record<LinkRelease, string> = {
  always: "As soon as they register (or are approved / paid)",
  "3_days": "3 days before it starts",
  day_of: "On the day it starts (from midnight)",
  "1_hour": "1 hour before it starts",
};

/** When the joining link opens, mirroring programme_link_release_at() in the database. */
export function linkReleaseAt(startsAt: string, tz: string, rule: string): string | null {
  const start = Date.parse(startsAt);
  if (rule === "3_days") return new Date(start - 3 * 86_400_000).toISOString();
  if (rule === "1_hour") return new Date(start - 3_600_000).toISOString();
  if (rule === "day_of") {
    const local = isoToZonedInput(startsAt, tz).slice(0, 10);
    return zonedInputToIso(`${local}T00:00`, tz);
  }
  return null;
}

/** The website section a programme's category belongs to, e.g. "Ministry" → the Ministry page. */
export function branchForCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/minist|church|bible|pray|gospel|crusade|revival|worship|evangel|repent|christ|deliverance/.test(t)) return "ministry";
  if (/nurs|midwi|class|lesson|tutor|school|exam|maths|science|english|literacy|student|teach/.test(t)) return "ziva";
  if (/tech|web|software|computer|coding|digital|app\b|ict/.test(t)) return "tech";
  if (/shoe|footwear|sandal|leather|wear/.test(t)) return "wear";
  if (/media|video|photo|film|camera|editing/.test(t)) return "media";
  if (/book|author|writing|reading club/.test(t)) return "books";
  return null;
}

/**
 * The "when" line shown to people. A repeat note without a time of day
 * ("27th to 29th November 2026, every evening") gets the times added,
 * so registrants always see when it starts and ends.
 */
export function scheduleText(note: string, startsAt: string, endsAt: string, tz: string) {
  if (!note) return `${formatWhen(startsAt, tz)} to ${formatTime(endsAt, tz)}`;
  if (/\d\s*(:\d{2})?\s*(am|pm)\b/i.test(note)) return note;
  return `${note}, ${formatTime(startsAt, tz)} to ${formatTime(endsAt, tz)} (Ghana time)`.replace(" (Ghana time)", tz === "Africa/Accra" ? " (Ghana time)" : "");
}

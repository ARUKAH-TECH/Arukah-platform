export const PROJECT_STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft (hidden)",
  scheduled: "Scheduled (goes live at the publish time)",
  published: "Published",
  archived: "Archived (hidden)",
};

export interface CmsFormState {
  status: "idle" | "error" | "saved";
  message: string;
}

export const initialCmsFormState: CmsFormState = { status: "idle", message: "" };

// Ghana uses GMT all year, so admin date/time inputs are read as UTC.
export function toInputDateTime(iso: string | null) {
  return iso ? iso.slice(0, 16) : "";
}

export function fromInputDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// Announcements ---------------------------------------------------------------

export const ANNOUNCEMENT_TONES = ["info", "highlight", "urgent"] as const;
export type AnnouncementToneValue = (typeof ANNOUNCEMENT_TONES)[number];

export const TONE_LABELS: Record<AnnouncementToneValue, string> = {
  info: "Standard (dark bar)",
  highlight: "Highlight (division colour)",
  urgent: "Urgent (red bar)",
};

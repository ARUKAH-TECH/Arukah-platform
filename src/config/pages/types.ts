// Editable page text: shared definitions used by the public pages (to read
// text with safe defaults) and by the admin editor (to build the form).
// Nothing here is server-only, and nothing here is secret.

export type FieldKind = "text" | "textarea" | "list";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  /** Characters per value (per item, for lists). */
  max: number;
  /** Lists only: maximum number of lines kept. */
  maxItems?: number;
  /** The original wording — shown whenever the admin hasn't changed it. */
  default: string | string[];
}

export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export interface PageDef {
  id: string;
  label: string;
  path: string;
  groups: FieldGroup[];
}

export type PageText = Record<string, string | string[]>;

export function allFields(page: PageDef): FieldDef[] {
  return page.groups.flatMap((group) => group.fields);
}

export function defaultsFor(page: PageDef): PageText {
  return Object.fromEntries(allFields(page).map((field) => [field.key, field.default]));
}

/**
 * Overlays stored edits on the original wording. Anything missing, empty, of
 * the wrong type, or too long falls back to the original, so a bad or partial
 * row can never break a page or leave a heading blank.
 */
export function mergePageText(page: PageDef, stored: unknown): PageText {
  const result = defaultsFor(page);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return result;
  const values = stored as Record<string, unknown>;

  for (const field of allFields(page)) {
    const value = values[field.key];
    if (field.kind === "list") {
      if (!Array.isArray(value)) continue;
      const items = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item && item.length <= field.max)
        .slice(0, field.maxItems ?? 12);
      if (items.length > 0) result[field.key] = items;
    } else if (typeof value === "string") {
      const text = value.trim();
      if (text && text.length <= field.max) result[field.key] = text;
    }
  }
  return result;
}

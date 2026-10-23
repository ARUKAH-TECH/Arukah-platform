import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { defaultsFor, mergePageText, type PageDef, type PageText } from "@/config/pages";

/**
 * The page's text: admin edits laid over the original wording. Any failure
 * (database down, settings missing, bad row) returns the original wording —
 * the page always renders.
 */
export async function getPageText(page: PageDef): Promise<PageText> {
  let client;
  try {
    client = createPublicClient();
  } catch (error) {
    console.error("[page-text] Supabase not configured", (error as Error).message);
    return defaultsFor(page);
  }

  const { data, error } = await client.from("page_content").select("content").eq("page", page.id).maybeSingle();
  if (error) {
    console.error(`[page-text] ${page.id} read failed`, error.message);
    return defaultsFor(page);
  }
  return mergePageText(page, data?.content);
}

/** Typed accessors so pages read cleanly: t.text("heroTagline"), t.list("techServices"). */
export function textReader(values: PageText) {
  return {
    text: (key: string) => {
      const value = values[key];
      return typeof value === "string" ? value : "";
    },
    list: (key: string) => {
      const value = values[key];
      return Array.isArray(value) ? value : [];
    },
  };
}

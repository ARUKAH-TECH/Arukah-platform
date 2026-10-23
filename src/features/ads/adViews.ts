"use client";

import { createClient } from "@/lib/supabase/browser";

// Counts an advert view once per advert per page load, only while the page is
// actually visible. Failures are ignored — counting must never affect the page.
const counted = new Set<string>();

export function countAdView(id: string) {
  if (counted.has(id) || typeof document === "undefined" || document.visibilityState !== "visible") return;
  counted.add(id);
  try {
    void createClient()
      .rpc("record_ad_event", { ad: id, kind: "view" })
      .then(() => undefined, () => undefined);
  } catch {
    // ignore
  }
}

"use client";

import { useEffect } from "react";
import { countAdView } from "@/features/ads/adViews";

/** Counts one view of an advert that is shown on the page (used by the video slot). */
export function AdViewPing({ id }: { id: string }) {
  useEffect(() => {
    countAdView(id);
  }, [id]);
  return null;
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sourceFromReferrer } from "./sources";

// Sends one anonymous "page viewed" count per page. The first page of a
// browsing session also says where the visitor came from (WhatsApp, Google…).
// No cookies; a sessionStorage flag only remembers "already counted the visit".

export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || navigator.webdriver) return;
    let visit = false;
    try {
      visit = !sessionStorage.getItem("zv-visit");
      sessionStorage.setItem("zv-visit", "1");
    } catch {
      visit = false;
    }
    const utm = new URLSearchParams(window.location.search).get("utm_source");
    const body = JSON.stringify({
      path: pathname,
      visit,
      source: visit ? sourceFromReferrer(document.referrer, window.location.hostname, utm) : "direct",
    });
    try {
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
        fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch {
      // counting must never break the page
    }
  }, [pathname]);
  return null;
}

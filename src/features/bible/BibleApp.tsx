"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

/** Makes the Bible installable and lets opened chapters work offline. */
export function BibleAppSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/bible-sw.js", { scope: "/bible" }).catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallPromptEvent;
      listeners.forEach((l) => l());
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}

/** "Install the Bible app" button, shown only where the browser allows it. */
export function InstallBible() {
  const [can, setCan] = useState(false);
  useEffect(() => {
    const update = () => setCan(Boolean(deferred) && !window.matchMedia("(display-mode: standalone)").matches);
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);
  if (!can) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        if (!deferred) return;
        await deferred.prompt();
        await deferred.userChoice;
        deferred = null;
        setCan(false);
      }}
      className="rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c]"
    >
      📲 Install R.O.M Bible Guide
    </button>
  );
}

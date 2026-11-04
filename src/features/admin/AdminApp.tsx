"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

/** Registers the admin app's service worker (offline page only — no data is cached). */
export function AdminAppSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {
        // Not fatal: the admin works the same without it.
      });
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred = event as InstallPromptEvent;
      listeners.forEach((l) => l());
    };
    const onInstalled = () => {
      deferred = null;
      listeners.forEach((l) => l());
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}

/** "Install the admin app" — shown on the dashboard when the phone allows it. */
export function InstallAdminApp() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [computer, setComputer] = useState(false);

  useEffect(() => {
    const update = () => setCanInstall(Boolean(deferred));
    update();
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setComputer(!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.maxTouchPoints < 2);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  if (installed) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-zinc-900">
      <span aria-hidden="true" className="text-2xl">📲</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Install the admin as an app</p>
        <p className="text-foreground/60">
          {canInstall
            ? computer ? "Opens straight to your dashboard from your desktop or Start menu." : "Opens straight to your dashboard from your home screen, full-screen."
            : computer
              ? "On a computer, use Chrome or Edge. Chrome: click the install icon at the right end of the address bar, or ⋮ → Cast, save and share → Install page as app. Edge: ⋯ → Apps → Install this site as an app."
              : "In Chrome: tap ⋮ (top right) → “Install app” or “Add to Home screen”."}
        </p>
      </div>
      {canInstall && (
        <button
          type="button"
          onClick={async () => {
            if (!deferred) return;
            await deferred.prompt();
            await deferred.userChoice;
            deferred = null;
            setCanInstall(false);
          }}
          className="rounded-full bg-brand-primary px-5 py-2 font-medium text-brand-on-primary"
        >
          Install
        </button>
      )}
    </div>
  );
}

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

type ReminderState = "checking" | "unsupported" | "ios-install" | "off" | "on" | "blocked" | "busy" | "error";

function keyBytes(base64url: string) {
  const b64 = (base64url + "===".slice((base64url.length + 3) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** "🔔 Daily devotional" — a notification each morning with the devotional and its scripture. */
export function DailyReminder({ dark = false }: { dark?: boolean }) {
  const [state, setState] = useState<ReminderState>("checking");

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState(ios && !standalone ? "ios-install" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function turnOn() {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch("/api/bible/push");
      const { publicKey } = (await res.json()) as { publicKey?: string };
      if (!publicKey) throw new Error("key");
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const saved = await fetch("/api/bible/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      if (!saved.ok) throw new Error("save");
      setState("on");
    } catch {
      setState("error");
    }
  }

  async function turnOff() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/bible/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("error");
    }
  }

  const note = dark ? "text-white/70" : "text-foreground/60";
  if (state === "checking" || state === "unsupported") return null;
  if (state === "ios-install") return <p className={`text-sm ${note}`}>🔔 On iPhone: tap Share → Add to Home Screen, open R.O.M Bible Guide from there, then turn on the daily devotional.</p>;
  if (state === "blocked") return <p className={`text-sm ${note}`}>🔔 Notifications are blocked for this site. To get the daily devotional, allow notifications for zivarukah.com in your browser settings.</p>;
  if (state === "on")
    return (
      <p className={`flex flex-wrap items-center gap-2 text-sm ${note}`}>
        <span className="font-semibold text-emerald-500">🔔 Daily devotional is on</span> (every morning around 6:00am)
        <button type="button" onClick={turnOff} className="underline">
          Turn off
        </button>
      </p>
    );
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={turnOn}
        disabled={state === "busy"}
        className="w-fit rounded-full bg-[#e3a82a] px-5 py-2.5 text-sm font-semibold text-[#14110c] disabled:opacity-60"
      >
        {state === "busy" ? "⏳ Please wait…" : "🔔 Get the daily devotional"}
      </button>
      <span className={`text-xs ${note}`}>A notification each morning with the devotional and its scripture. Free, no sign-up.</span>
      {state === "error" && <span className="text-xs text-rose-500">That didn&apos;t work. Check your internet and try again.</span>}
    </div>
  );
}

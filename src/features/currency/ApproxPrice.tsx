"use client";

import { useEffect, useState } from "react";

// Shows "≈ $12" after a cedi price for visitors abroad. One request per page,
// shared by every price on it. Nothing is shown in Ghana or if rates fail.

interface Local {
  currency: string | null;
  rate?: number;
}

const STORAGE_KEY = "zivarukah-currency";
let pending: Promise<Local> | null = null;
const listeners = new Set<(local: Local) => void>();

function chosen() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function load(force = false): Promise<Local> {
  if (!pending || force) {
    const choice = chosen();
    pending = fetch(`/api/local-currency${choice ? `?c=${encodeURIComponent(choice)}` : ""}`)
      .then((response) => (response.ok ? response.json() : { currency: null }))
      .catch(() => ({ currency: null }));
  }
  return pending;
}

export function setPreferredCurrency(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Private browsing — the choice just isn't remembered.
  }
  load(true).then((local) => listeners.forEach((listener) => listener(local)));
}

export function useLocalCurrency() {
  const [local, setLocal] = useState<Local>({ currency: null });
  useEffect(() => {
    let alive = true;
    load().then((value) => alive && setLocal(value));
    listeners.add(setLocal);
    return () => {
      alive = false;
      listeners.delete(setLocal);
    };
  }, []);
  return local;
}

export function formatApprox(ghs: number, local: Local) {
  if (!local.currency || !local.rate) return null;
  const value = ghs * local.rate;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: local.currency,
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);
  } catch {
    return null;
  }
}

export function ApproxPrice({ ghs, className = "" }: { ghs: number; className?: string }) {
  const local = useLocalCurrency();
  const text = formatApprox(ghs, local);
  if (!text) return null;
  return (
    <span className={`whitespace-nowrap font-normal text-foreground/60 ${className}`} title="Approximate. You are charged in Ghana cedis (GHS).">
      {" "}
      ≈ {text}
    </span>
  );
}

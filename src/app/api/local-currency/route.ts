import { currencyForCountry, SELECTABLE } from "@/features/currency/currencies";

// Tells the browser which currency to show approximate prices in, and the
// rate from cedis. Rates come from a free public source, refreshed daily.
// Prices are always charged in GHS — this is only a guide for visitors abroad.

interface Rates {
  rates: Record<string, number>;
  updated: string;
}

async function ghsRates(): Promise<Rates | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/GHS", { next: { revalidate: 86400 } });
    const body = (await response.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    if (body.result !== "success" || !body.rates) return null;
    return { rates: body.rates, updated: body.time_last_update_utc ?? "" };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const asked = url.searchParams.get("c")?.toUpperCase() ?? "";
  const currency = /^[A-Z]{3}$/.test(asked) ? asked : currencyForCountry(request.headers.get("x-vercel-ip-country"));
  const headers = { "Cache-Control": "private, max-age=3600" };

  if (!currency || currency === "GHS") return Response.json({ currency: null, choices: SELECTABLE }, { headers });
  const data = await ghsRates();
  const rate = data?.rates[currency];
  if (!rate) return Response.json({ currency: null, choices: SELECTABLE }, { headers });
  return Response.json({ currency, rate, updated: data!.updated, choices: SELECTABLE }, { headers });
}

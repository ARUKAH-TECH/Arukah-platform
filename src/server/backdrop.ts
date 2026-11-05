import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { askJson } from "@/server/ai";
import { themesFor } from "@/server/bibleAuto";
import { todayInGhana } from "@/server/bible";

// Backgrounds for the R.O.M Bible Guide share pictures.
// Each month the free AI reads that month's theme (and the year's) and picks a
// picture style: the scene (sunrise, sea, mountains, light rays…), a symbol
// (cross, dove, crown, flame, open Bible) and the colours. The picture is then
// drawn here in code, so it is free and instant, and every verse gets its own
// variation of the month's style. No theme or no AI → a built-in style.

export const SCENES = ["sunrise", "mountains", "sea", "rays", "night", "field", "clouds"] as const;
export const SYMBOLS = ["cross", "dove", "crown", "flame", "book", "none"] as const;
type Scene = (typeof SCENES)[number];
type SymbolName = (typeof SYMBOLS)[number];

interface Variant {
  scene: Scene;
  symbol: SymbolName;
}

/** One month's family of pictures: shared colours, 3–5 different scenes. */
export interface Design {
  sky: [string, string, string]; // top, middle, horizon
  glow: string;
  land: string;
  variants: Variant[];
}

type Palette = Omit<Design, "variants">;
const family = (p: Palette, main: Variant, ...others: Variant[]): Design => ({ ...p, variants: [main, ...others] });

const DEFAULTS: Design[] = [
  family({ sky: ["#121838", "#8a3c5a", "#ffb460"], glow: "#ffe2a0", land: "#1e1220" }, { scene: "sunrise", symbol: "cross" }, { scene: "rays", symbol: "none" }, { scene: "sea", symbol: "none" }, { scene: "mountains", symbol: "none" }),
  family({ sky: ["#2a1e12", "#3a2a2a", "#c08a50"], glow: "#ffd98a", land: "#0c0a10" }, { scene: "rays", symbol: "crown" }, { scene: "sunrise", symbol: "none" }, { scene: "night", symbol: "cross" }, { scene: "field", symbol: "none" }),
  family({ sky: ["#060a1e", "#2a1650", "#784660"], glow: "#ffd6a0", land: "#0a0812" }, { scene: "night", symbol: "cross" }, { scene: "sea", symbol: "none" }, { scene: "rays", symbol: "none" }, { scene: "mountains", symbol: "none" }),
  family({ sky: ["#2a1e50", "#a84670", "#ffb070"], glow: "#ffe0a0", land: "#120e26" }, { scene: "sea", symbol: "none" }, { scene: "sunrise", symbol: "dove" }, { scene: "clouds", symbol: "none" }, { scene: "night", symbol: "none" }),
  family({ sky: ["#1e3260", "#7a96c0", "#e8c8aa"], glow: "#fff0d0", land: "#121630" }, { scene: "mountains", symbol: "none" }, { scene: "sunrise", symbol: "cross" }, { scene: "clouds", symbol: "dove" }, { scene: "sea", symbol: "none" }),
  family({ sky: ["#3a5a9a", "#f0b890", "#ffe0b0"], glow: "#fff4d8", land: "#3a2a18" }, { scene: "field", symbol: "dove" }, { scene: "sunrise", symbol: "none" }, { scene: "rays", symbol: "book" }, { scene: "mountains", symbol: "none" }),
  family({ sky: ["#164a96", "#5aa0dc", "#c0dcf4"], glow: "#fffbe8", land: "#1a3050" }, { scene: "clouds", symbol: "dove" }, { scene: "sea", symbol: "none" }, { scene: "mountains", symbol: "none" }, { scene: "rays", symbol: "none" }),
];

const HEX = /^#[0-9a-f]{6}$/i;

function cleanVariant(raw: unknown): Variant | null {
  const o = (raw ?? {}) as Record<string, unknown>;
  const scene = SCENES.find((x) => x === o.scene);
  if (!scene) return null;
  return { scene, symbol: SYMBOLS.find((x) => x === o.symbol) ?? "none" };
}

function cleanDesign(raw: Record<string, unknown> | null): Design | null {
  if (!raw) return null;
  const sky = Array.isArray(raw.sky) ? raw.sky.filter((c): c is string => typeof c === "string" && HEX.test(c)) : [];
  const glow = typeof raw.glow === "string" && HEX.test(raw.glow) ? raw.glow : null;
  const land = typeof raw.land === "string" && HEX.test(raw.land) ? raw.land : null;
  const variants = (Array.isArray(raw.variants) ? raw.variants : [raw]).map(cleanVariant).filter((v): v is Variant => Boolean(v)).slice(0, 5);
  if (sky.length < 3 || !glow || !land || !variants.length) return null;
  return { sky: [sky[0], sky[1], sky[2]], glow, land, variants };
}

/** This month's picture style (made once per month, and again if the themes change). */
export async function monthDesign(day = todayInGhana()): Promise<Design> {
  const period = day.slice(0, 7);
  const fallback = DEFAULTS[(Number(day.slice(5, 7)) - 1) % DEFAULTS.length];
  try {
    const client = createServiceClient();
    const themes = await themesFor(day, client);
    const key = [themes.year?.theme, themes.year?.scripture, themes.month?.theme, themes.month?.scripture].map((x) => x ?? "").join("|").slice(0, 600);
    const { data: saved } = await client.from("bible_backdrops").select("theme_key, design").eq("period", period).maybeSingle();
    if (saved && saved.theme_key === key) return cleanDesign(saved.design as Record<string, unknown>) ?? fallback;
    if (!themes.year && !themes.month) return fallback;

    const system = `You design the background picture for Bible verse images shared on WhatsApp by a church in Ghana. Make a family of 4 pictures for the month: they share the same colours so they clearly belong together, but each shows a different scene. The FIRST is the main picture of the month. Return ONLY JSON:
{"sky": ["#rrggbb" top, "#rrggbb" middle, "#rrggbb" near the horizon], "glow": "#rrggbb" light of the sun or heaven, "land": "#rrggbb" dark colour of the hills or sea, "variants": [{"scene": one of ${JSON.stringify(SCENES)}, "symbol": one of ${JSON.stringify(SYMBOLS)}}, … 4 items, all different scenes]}
Rules: beautiful, hopeful, eye-catching colours; the land colour must be dark; white writing must stay readable; the main picture must match the meaning (e.g. new beginnings → sunrise, Holy Spirit → dove or flame, kingdom/victory → crown, the Word → book, the cross/salvation → cross, peace → sea or clouds, faithfulness at night → night).`;
    const prompt = `Theme of the year: ${themes.year ? `${themes.year.theme}${themes.year.scripture ? ` (${themes.year.scripture})` : ""}` : "(none)"}\nTheme of the month: ${themes.month ? `${themes.month.theme}${themes.month.scripture ? ` (${themes.month.scripture})` : ""}` : "(none)"}`;
    const design = cleanDesign(await askJson(system, prompt, 700));
    if (!design) return saved ? (cleanDesign(saved.design as Record<string, unknown>) ?? fallback) : fallback;
    await client.from("bible_backdrops").upsert({ period, theme_key: key, design });
    return design;
  } catch {
    return fallback;
  }
}

// ---- Drawing -------------------------------------------------------------

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** A smooth hill line across the picture, filled down to the bottom. */
function hill(W: number, H: number, base: number, amp: number, points: number, r: () => number) {
  const pts = Array.from({ length: points + 1 }, (_, i) => [(W * i) / points, H * (base - amp * r())]);
  let d = `M0,${H} L${pts[0][0]},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last[0]},${last[1].toFixed(1)} L${W},${H} Z`;
  return { d, top: (x: number) => pts.reduce((best, p) => (Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best))[1] };
}

const SYMBOL_PATHS: Record<Exclude<SymbolName, "none">, string> = {
  cross: "M44,0 H56 V24 H80 V35 H56 V100 H44 V35 H20 V24 H44 Z",
  dove: "M8,56 C22,42 38,40 50,46 C56,30 70,16 94,10 C82,28 76,40 72,50 C82,52 90,56 96,62 C82,63 72,63 64,61 C56,72 42,78 26,76 C34,71 39,67 41,62 C29,63 17,61 8,56 Z",
  crown: "M8,78 L14,30 L32,56 L50,16 L68,56 L86,30 L92,78 Z M8,84 H92 V96 H8 Z",
  flame: "M50,0 C62,22 84,38 82,64 C80,86 64,100 50,100 C36,100 20,86 18,64 C16,46 32,36 36,20 C42,34 45,40 50,44 C54,32 55,18 50,0 Z",
  book: "M50,30 C38,20 20,18 4,22 V82 C20,78 38,80 50,90 Z M50,30 C62,20 80,18 96,22 V82 C80,78 62,80 50,90 Z",
};

/** The background picture as SVG, varied by `seed` (each verse looks a little different). */
export function backdropSvg(design: Design, W: number, H: number, seed: number) {
  const r = rng(seed);
  // Every other verse uses the month's main picture; the rest use its sister scenes.
  const pick = seed % 2 === 0 || design.variants.length === 1 ? 0 : 1 + ((seed >>> 1) % (design.variants.length - 1));
  const { scene, symbol } = design.variants[pick];
  const { glow, land } = design;
  const sky: [string, string, string] = pick === 0 ? design.sky : [design.sky[0], mix(design.sky[1], glow, 0.08 * pick), design.sky[2]];
  const horizon = scene === "rays" || scene === "clouds" || scene === "night" ? 0.86 : 0.6 + r() * 0.06;
  const sunX = W * (0.25 + r() * 0.5);
  const sunY = scene === "rays" ? -H * 0.04 : scene === "clouds" ? H * 0.06 : scene === "night" ? H * 0.22 : H * (horizon - 0.02);
  const parts: string[] = [];
  const defs = `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="${(horizon * 0.62).toFixed(2)}" stop-color="${sky[1]}"/><stop offset="${horizon.toFixed(2)}" stop-color="${sky[2]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${glow}" stop-opacity="0.95"/><stop offset="0.35" stop-color="${glow}" stop-opacity="0.45"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(land, sky[2], 0.35)}"/><stop offset="1" stop-color="${land}"/></linearGradient>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(W / 40).toFixed(0)}"/></filter>
<filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(W / 90).toFixed(0)}"/></filter>
</defs>`;
  parts.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);

  if (scene === "night") {
    for (let i = 0; i < 260; i++) {
      parts.push(`<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H * 0.78).toFixed(0)}" r="${(0.6 + r() ** 3 * 2.4).toFixed(1)}" fill="#ffffff" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`);
    }
    parts.push(`<ellipse cx="${W * 0.5}" cy="${H * 0.4}" rx="${W * 0.7}" ry="${H * 0.12}" transform="rotate(-35 ${W * 0.5} ${H * 0.4})" fill="${mix(sky[1], "#ffffff", 0.35)}" opacity="0.18" filter="url(#soft)"/>`);
  }
  // Light from heaven / the sun.
  parts.push(`<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${(W * (scene === "rays" ? 0.9 : 0.6)).toFixed(0)}" fill="url(#glow)"/>`);
  if (scene === "rays" || scene === "clouds" || scene === "sunrise") {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * (i + r() * 0.6)) / n;
      const spread = 0.025 + r() * 0.03;
      const len = H * 1.6;
      const x1 = sunX + Math.cos(a - spread) * len;
      const y1 = sunY + Math.sin(a - spread) * len * (scene === "sunrise" ? -1 : 1);
      const x2 = sunX + Math.cos(a + spread) * len;
      const y2 = sunY + Math.sin(a + spread) * len * (scene === "sunrise" ? -1 : 1);
      parts.push(`<path d="M${sunX.toFixed(0)},${sunY.toFixed(0)} L${x1.toFixed(0)},${y1.toFixed(0)} L${x2.toFixed(0)},${y2.toFixed(0)} Z" fill="${glow}" opacity="${(scene === "rays" ? 0.1 + r() * 0.14 : 0.05 + r() * 0.07).toFixed(2)}"/>`);
    }
  }
  if (scene !== "rays" && scene !== "night" && scene !== "clouds") {
    parts.push(`<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${(W * 0.075).toFixed(0)}" fill="${mix(glow, "#ffffff", 0.55)}"/>`);
  }
  if (scene === "clouds" || scene === "sunrise" || scene === "sea") {
    const count = scene === "clouds" ? 9 : 4;
    for (let i = 0; i < count; i++) {
      const cy = H * (scene === "clouds" ? 0.15 + r() * 0.6 : 0.08 + r() * 0.3);
      parts.push(`<ellipse cx="${(r() * W).toFixed(0)}" cy="${cy.toFixed(0)}" rx="${(W * (0.18 + r() * 0.22)).toFixed(0)}" ry="${(H * (0.035 + r() * 0.04)).toFixed(0)}" fill="${scene === "clouds" ? "#ffffff" : mix(glow, sky[1], 0.4)}" opacity="${scene === "clouds" ? 0.7 : 0.45}" filter="url(#soft)"/>`);
    }
  }

  let front: ReturnType<typeof hill> | null = null;
  if (scene === "sea") {
    parts.push(`<rect y="${(H * horizon).toFixed(0)}" width="${W}" height="${(H * (1 - horizon)).toFixed(0)}" fill="url(#sea)"/>`);
    for (let i = 0; i < 46; i++) {
      const y = H * horizon + (H * (1 - horizon) * (i + r())) / 46;
      const w = W * (0.04 + ((y / H - horizon) / (1 - horizon)) * 0.3) * (0.5 + r());
      parts.push(`<rect x="${(sunX - w / 2 + (r() - 0.5) * W * 0.05).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(2 + r() * 3).toFixed(0)}" fill="${glow}" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`);
    }
  } else {
    const layers = scene === "mountains" ? 4 : scene === "rays" || scene === "clouds" || scene === "night" ? 1 : 3;
    for (let i = 0; i < layers; i++) {
      const isFront = i === layers - 1;
      const base = layers === 1 ? 0.94 : horizon + 0.05 + (i * (0.95 - horizon)) / layers;
      const amp = scene === "mountains" ? 0.16 - i * 0.025 : 0.06 + r() * 0.04;
      const h = hill(W, H, base, amp, scene === "mountains" ? 9 : 5, r);
      parts.push(`<path d="${h.d}" fill="${mix(land, sky[2], (layers - 1 - i) * (scene === "mountains" ? 0.22 : 0.28))}"/>`);
      if (isFront) front = h;
    }
  }

  if (symbol !== "none") {
    const onHill = symbol === "cross" && front;
    const size = W * (onHill ? 0.17 : 0.2);
    const x = onHill ? W * (0.35 + r() * 0.3) : sunX;
    const y = onHill && front ? front.top(x) - size * 0.98 : Math.max(H * 0.2, Math.min(sunY, H * 0.45)) - size / 2;
    const fill = onHill ? land : "#ffffff";
    const tr = `translate(${(x - size / 2).toFixed(0)},${y.toFixed(0)}) scale(${(size / 100).toFixed(3)})`;
    if (!onHill) parts.push(`<path d="${SYMBOL_PATHS[symbol]}" transform="${tr}" fill="${glow}" opacity="0.9" filter="url(#halo)"/>`);
    parts.push(`<path d="${SYMBOL_PATHS[symbol]}" transform="${tr}" fill="${fill}" opacity="${onHill ? 1 : 0.92}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${parts.join("")}</svg>`;
}

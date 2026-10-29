// Cross-browser audit of zivarukah.com and learn.zivarukah.com.
import { chromium, firefox, webkit, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("shots", { recursive: true });
const MAIN = "https://zivarukah.com";
const LEARN = "https://learn.zivarukah.com";

async function sitemap() {
  try {
    const xml = await (await fetch(MAIN + "/sitemap.xml")).text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  } catch { return []; }
}
const mainPages = [...new Set([MAIN + "/", ...(await sitemap()), MAIN + "/contact", MAIN + "/advertise", MAIN + "/books/basket", MAIN + "/ministry/support", MAIN + "/literacy"])]
  .filter((u) => u.startsWith(MAIN)).slice(0, 60);
const learnPages = ["/", "/learn/", "/level/", "/stages/", "/reading/", "/reading/?mode=fluency", "/handwriting/", "/spelling/", "/phonics/", "/letters/", "/vocabulary/", "/punctuation/", "/progress/", "/account/", "/join/", "/comments/", "/install/"].map((p) => LEARN + p);
const pages = [...mainPages, ...learnPages];

const runs = [
  { name: "Safari iPhone (WebKit)", type: webkit, ctx: { ...devices["iPhone 13"] } },
  { name: "Safari iPhone DARK (WebKit)", type: webkit, ctx: { ...devices["iPhone 13"], colorScheme: "dark" }, contrastOnly: true },
  { name: "Safari Mac (WebKit)", type: webkit, ctx: { viewport: { width: 1366, height: 860 } } },
  { name: "Chrome Android (Chromium)", type: chromium, ctx: { ...devices["Pixel 7"] } },
  { name: "Firefox desktop", type: firefox, ctx: { viewport: { width: 1366, height: 860 } } },
  { name: "Edge desktop", type: chromium, launch: { channel: "msedge" }, ctx: { viewport: { width: 1366, height: 860 } } },
];

const report = { when: new Date().toISOString(), pages: pages.length, runs: [] };

for (const run of runs) {
  let browser;
  try { browser = await run.type.launch(run.launch ?? {}); } catch (e) { report.runs.push({ name: run.name, error: String(e).slice(0, 300) }); continue; }
  const ctx = await browser.newContext(run.ctx);
  const results = [];
  for (const url of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
    page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
    const failed = [];
    page.on("requestfailed", (r) => { const u = r.url(); if (!/google|facebook|analytics|_vercel\/insights/.test(u)) failed.push(u.slice(0, 150) + " " + (r.failure()?.errorText ?? "")); });
    const t0 = Date.now(); let status = 0;
    try {
      const res = await page.goto(url, { waitUntil: "load", timeout: 45000 });
      status = res?.status() ?? 0;
      await page.waitForTimeout(1200);
    } catch (e) { errors.push("goto: " + String(e).slice(0, 150)); }
    const ms = Date.now() - t0;
    const info = await page.evaluate(() => {
      const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a] = m.map(Number); if (a === 0) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (s.backgroundImage && s.backgroundImage !== "none") return null; const c = s.backgroundColor; const m = c.match(/[\d.]+/g); if (m && (m.length < 4 || Number(m[3]) > 0.9)) return c; } return "rgb(255,255,255)"; };
      const low = [];
      for (const el of document.querySelectorAll("p,span,a,li,h1,h2,h3,h4,button,label,td,small,strong")) {
        if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2)) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const s = getComputedStyle(el); if (s.visibility === "hidden" || Number(s.opacity) < 0.2) continue;
        const bg = bgOf(el); if (!bg) continue;
        const a = lum(s.color), b = lum(bg); if (a == null || b == null) continue;
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (ratio < 2) low.push(`${ratio.toFixed(1)} "${el.textContent.trim().slice(0, 40)}"`);
      }
      const imgs = [...document.images];
      return {
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.content?.slice(0, 80) ?? null,
        h1: document.querySelectorAll("h1").length,
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        brokenImgs: imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== "lazy").map((i) => i.src.slice(0, 120)),
        noAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
        unreadable: low.slice(0, 8),
        textLen: document.body?.innerText?.length ?? 0,
      };
    }).catch((e) => ({ error: String(e).slice(0, 120) }));
    let axe = null;
    if (run.name.startsWith("Chrome Android")) {
      try { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze(); axe = r.violations.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`); } catch {}
    }
    const slug = url.replace(/https:\/\//, "").replace(/[^a-z0-9]+/gi, "_").slice(0, 80);
    if (!run.contrastOnly || info.unreadable?.length) await page.screenshot({ path: `shots/${run.name.replace(/[^a-z]+/gi, "_")}__${slug}.png` }).catch(() => {});
    results.push({ url, status, ms, errors: errors.slice(0, 6), failed: failed.slice(0, 6), ...info, axe });
    await page.close();
  }
  report.runs.push({ name: run.name, results });
  await browser.close();
}
writeFileSync("report.json", JSON.stringify(report, null, 1));
console.log("done", pages.length, "pages");

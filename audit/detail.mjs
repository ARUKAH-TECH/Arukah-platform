// Details: which elements fail colour contrast, and what slows the home page.
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";
const urls = ["https://zivarukah.com/", "https://zivarukah.com/books", "https://zivarukah.com/books/the-wicked-and-unforgiving-student", "https://zivarukah.com/projects", "https://zivarukah.com/contact", "https://zivarukah.com/ministry", "https://zivarukah.com/tech",
  "https://learn.zivarukah.com/", "https://learn.zivarukah.com/handwriting/", "https://learn.zivarukah.com/account/", "https://learn.zivarukah.com/join/"];
const b = await chromium.launch(); const out = {};
for (const scheme of ["light", "dark"]) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], colorScheme: scheme });
  for (const u of urls) {
    const p = await ctx.newPage(); await p.goto(u, { waitUntil: "load" }); await p.waitForTimeout(1500);
    const r = await new AxeBuilder({ page: p }).withRules(["color-contrast", "link-name", "image-redundant-alt", "label-content-name-mismatch"]).analyze();
    out[`${scheme} ${u}`] = r.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 20).map((n) => ({ target: n.target.join(" "), html: n.html.slice(0, 160), why: (n.any[0]?.message ?? "").slice(0, 160) })) }));
    await p.close();
  }
}
writeFileSync("detail.json", JSON.stringify(out, null, 1));
await b.close();

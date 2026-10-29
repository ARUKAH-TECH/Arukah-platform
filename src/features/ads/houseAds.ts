import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublishedBooks } from "@/db/books";
import { listArticles } from "@/db/articles";
import { getPublicProjects } from "@/db/projects";
import { getGallery } from "@/db/gallery";
import { LITERACY_URL } from "@/config/literacy";

// "Our works" — shown in the advert spaces while no paid advert is running:
// the top strip rotates them every 15 seconds, and after 5 advert-free days
// a pop-up shows them for 48 hours (then rests 5 days, and so on).

export interface HouseAd {
  key: string;
  kicker: string; // "ZIVARUKAH BOOKS"
  title: string;
  text: string;
  cta: string;
  href: string;
  external?: boolean;
  image: { url: string; width: number | null; height: number | null; fit: "cover" | "contain" } | null;
  emoji: string;
  /** Tailwind gradient classes for the slide background. */
  theme: string;
}

export const HOUSE_SECONDS = 15;
const IDLE_DAYS = 5;
const POPUP_HOURS = 48;

const HIDDEN_SLUG = /^system-test/;

function short(text: string, max = 110) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export const getHouseAds = cache(async (): Promise<HouseAd[]> => {
  const [books, { articles }, projects, gallery] = await Promise.all([
    getPublishedBooks(),
    listArticles({ limit: 3 }),
    getPublicProjects(undefined, 4),
    getGallery("home", 4),
  ]);
  const ads: HouseAd[] = [
    {
      key: "literacy",
      kicker: "ZIVA Literacy · Free app",
      title: "Read, spell & write, with stars ⭐⭐⭐⭐⭐",
      text: "Reading, phonics, spelling and handwriting for KG to JHS. Works offline.",
      cta: "Open the app",
      href: LITERACY_URL,
      external: true,
      image: { url: "/branding/ziva-literacy/logo.webp", width: 480, height: 480, fit: "contain" },
      emoji: "✏️",
      theme: "from-[#0b69a8] to-[#0b3d91]",
    },
  ];
  for (const book of books.slice(0, 4)) {
    const prices = book.prices.map((p) => p.amount).filter((n) => n > 0);
    ads.push({
      key: `book-${book.id}`,
      kicker: "ZIVARUKAH BOOKS",
      title: book.title,
      text: book.highlights[0] ? `“${short(book.highlights[0], 90)}”` : short(book.description),
      cta: prices.length ? `From GHS ${Math.min(...prices).toFixed(2)}` : "Read a sample",
      href: `/books/${book.slug}`,
      image: book.cover ? { ...book.cover, fit: "contain" } : null,
      emoji: "📘",
      theme: "from-[#3b2405] via-[#7a4a12] to-[#c58a1e]",
    });
  }
  for (const project of projects) {
    if (HIDDEN_SLUG.test(project.slug)) continue;
    ads.push({
      key: `project-${project.id}`,
      kicker: "Our work",
      title: project.title,
      text: short(project.summary),
      cta: "See the project",
      href: `/projects/${project.slug}`,
      image: project.cover?.kind === "image" ? { url: project.cover.url, width: project.cover.width, height: project.cover.height, fit: "cover" } : null,
      emoji: "🛠️",
      theme: "from-[#064e3b] to-[#0f766e]",
    });
  }
  for (const photo of gallery.slice(0, 3)) {
    ads.push({
      key: `photo-${photo.id}`,
      kicker: "From our work",
      title: photo.caption || "Moments from ZIVARUKAH",
      text: "Software, footwear, classes, media, books and outreach.",
      cta: "See more",
      href: "/projects",
      image: { url: photo.url, width: photo.width, height: photo.height, fit: "cover" },
      emoji: "📸",
      theme: "from-[#1f2937] to-[#374151]",
    });
  }
  for (const article of articles) {
    if (HIDDEN_SLUG.test(article.slug)) continue;
    ads.push({
      key: `article-${article.id}`,
      kicker: article.category ? `Article · ${article.category.name}` : "New article",
      title: article.title,
      text: short(article.excerpt),
      cta: "Read it",
      href: `/articles/${article.slug}`,
      image: article.image ? { url: article.image.url, width: article.image.width, height: article.image.height, fit: "cover" } : null,
      emoji: "📰",
      theme: "from-[#111827] to-[#1f3a6b]",
    });
  }
  ads.push(
    {
      key: "ministry",
      kicker: "Repent Online Ministries",
      title: "Support hospital, prison & street outreach",
      text: "Give by Mobile Money or card. Every gift reaches people in need.",
      cta: "Give now",
      href: "/ministry/support",
      image: null,
      emoji: "🙏",
      theme: "from-[#14110c] to-[#3b2f14]",
    },
    {
      key: "tech",
      kicker: "ARUKAH TECH",
      title: "Websites, apps & management systems",
      text: "For schools, churches and businesses: built to work on every phone.",
      cta: "Talk to us",
      href: "/tech",
      image: null,
      emoji: "💻",
      theme: "from-[#0b3d91] to-[#1d4ed8]",
    },
  );
  return ads;
});

/**
 * The pop-up's 48-hour window. `idleSince` = when the last paid advert ended
 * (null while one is live). Cycle: 5 quiet days, then 48 hours of pop-up.
 */
export function popupWindow(idleSince: string | null, now = Date.now()): { active: boolean; endsAt: number | null } {
  if (!idleSince) return { active: false, endsAt: null };
  const start = Date.parse(idleSince);
  if (Number.isNaN(start)) return { active: false, endsAt: null };
  const day = 86_400_000;
  const cycle = IDLE_DAYS * day + POPUP_HOURS * 3_600_000;
  const elapsed = now - start;
  if (elapsed < IDLE_DAYS * day) return { active: false, endsAt: null };
  const phase = elapsed % cycle;
  const inWindow = phase >= IDLE_DAYS * day;
  return { active: inWindow, endsAt: inWindow ? now - phase + cycle : null };
}

export const getPopupWindow = cache(async () => {
  try {
    const { data, error } = await createPublicClient().rpc("ads_idle_since");
    if (error) throw error;
    return popupWindow((data as string | null) ?? null);
  } catch {
    return { active: false, endsAt: null };
  }
});

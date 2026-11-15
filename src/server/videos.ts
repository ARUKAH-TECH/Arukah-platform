import "server-only";
import { getPageText } from "@/db/pageContent";
import { socialPage } from "@/config/pages";

// Videos from the owner's own channels, shown on /videos so search engines can
// list them under his name. YouTube: the newest videos come from the channel's
// public feed (no key needed). TikTok and Facebook: links the owner adds in
// Admin → Page text → Social media links → "Extra videos" (TikTok details
// come from TikTok's public oEmbed). Everything is cached; a failure just
// shows fewer videos, never an error.

export interface Video {
  /** Our page id: "yt-<id>" or "tt-<id>". Facebook videos have no page of their own. */
  key: string;
  platform: "youtube" | "tiktok" | "facebook";
  title: string;
  description: string;
  thumbnail: string | null;
  published: string | null;
  /** Link to the video on its platform. */
  url: string;
  /** Player address for our watch page. */
  embedUrl: string | null;
  author: string;
}

const SIX_HOURS = 6 * 3600;
const UA = { "User-Agent": "Mozilla/5.0 (compatible; ZIVARUKAH-site/1.0; +https://zivarukah.com)", "Accept-Language": "en" };

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();

async function youtubeChannelId(channelUrl: string): Promise<string | null> {
  const direct = channelUrl.match(/\/channel\/(UC[\w-]{22})/);
  if (direct) return direct[1];
  try {
    const res = await fetch(channelUrl, { headers: UA, next: { revalidate: 7 * 86400 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/"externalId":"(UC[\w-]{22})"/) ?? html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ?? html.match(/"channelId":"(UC[\w-]{22})"/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function youtubeVideos(channelUrl: string): Promise<Video[]> {
  const id = await youtubeChannelId(channelUrl);
  if (!id) return [];
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { headers: UA, next: { revalidate: SIX_HOURS }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const xml = await res.text();
    const author = decode(xml.match(/<author>\s*<name>([\s\S]*?)<\/name>/)?.[1] ?? "");
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([, e]) => {
      const vid = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
      if (!vid) return [];
      return [
        {
          key: `yt-${vid}`,
          platform: "youtube" as const,
          title: decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "Video"),
          description: decode(e.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? ""),
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          published: e.match(/<published>([^<]+)<\/published>/)?.[1] ?? null,
          url: `https://www.youtube.com/watch?v=${vid}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${vid}`,
          author,
        },
      ];
    });
  } catch {
    return [];
  }
}

async function linkVideo(raw: string): Promise<Video | null> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  const yt = host === "youtu.be" ? url.pathname.slice(1) : host === "youtube.com" ? (url.searchParams.get("v") ?? url.pathname.match(/^\/(shorts|live|embed)\/([\w-]{11})/)?.[2]) : null;
  if (yt && /^[\w-]{11}$/.test(yt)) {
    const meta = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt}`)}`);
    return { key: `yt-${yt}`, platform: "youtube", title: meta?.title ?? "YouTube video", description: "", thumbnail: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, published: null, url: `https://www.youtube.com/watch?v=${yt}`, embedUrl: `https://www.youtube-nocookie.com/embed/${yt}`, author: meta?.author_name ?? "" };
  }

  if (host.endsWith("tiktok.com")) {
    const meta = await oembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url.toString())}`);
    const id = url.pathname.match(/\/video\/(\d{6,25})/)?.[1] ?? meta?.embed_product_id ?? null;
    if (!id && !meta) return null;
    return {
      key: id ? `tt-${id}` : `tt-${encodeURIComponent(url.pathname)}`,
      platform: "tiktok",
      title: meta?.title?.trim() || "TikTok video",
      description: "",
      thumbnail: meta?.thumbnail_url ?? null,
      published: null,
      url: url.toString(),
      embedUrl: id ? `https://www.tiktok.com/embed/v2/${id}` : null,
      author: meta?.author_name ?? "",
    };
  }

  if (host.endsWith("facebook.com") || host === "fb.watch") {
    return { key: `fb-${encodeURIComponent(url.pathname + url.search)}`, platform: "facebook", title: "Facebook video", description: "", thumbnail: null, published: null, url: url.toString(), embedUrl: null, author: "" };
  }
  return null;
}

interface OEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  embed_product_id?: string;
}

async function oembed(endpoint: string): Promise<OEmbed | null> {
  try {
    const res = await fetch(endpoint, { headers: UA, next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) });
    return res.ok ? ((await res.json()) as OEmbed) : null;
  } catch {
    return null;
  }
}

/** All videos, newest YouTube first, then the extra links in the order added. */
export async function getVideos(): Promise<Video[]> {
  const text = await getPageText(socialPage);
  const links = Array.isArray(text.links) ? text.links : [];
  const extra = Array.isArray(text.videos) ? text.videos : [];
  const channels = links.filter((l) => /youtube\.com\/(@|channel\/|c\/)/.test(l));
  const [fromChannels, fromLinks] = await Promise.all([
    Promise.all(channels.map(youtubeVideos)).then((x) => x.flat()),
    Promise.all(extra.map(linkVideo)).then((x) => x.filter((v): v is Video => v !== null)),
  ]);
  const seen = new Set<string>();
  return [...fromChannels, ...fromLinks].filter((v) => (seen.has(v.key) ? false : (seen.add(v.key), true)));
}

export async function getVideo(key: string) {
  return (await getVideos()).find((v) => v.key === key && v.embedUrl) ?? null;
}

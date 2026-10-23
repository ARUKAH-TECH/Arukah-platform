export type VideoLink =
  | { platform: "youtube"; id: string; embedUrl: string; url: string }
  | { platform: "tiktok"; url: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Accepts only YouTube and TikTok links; returns null for anything else. */
export function parseVideoLink(raw: string): VideoLink | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, "");

  let youtubeId: string | null = null;
  if (host === "youtu.be") youtubeId = url.pathname.slice(1);
  else if (host === "youtube.com") {
    if (url.pathname === "/watch") youtubeId = url.searchParams.get("v");
    else {
      const match = url.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
      if (match) youtubeId = match[2];
    }
  }
  if (youtubeId && YOUTUBE_ID.test(youtubeId)) {
    return {
      platform: "youtube",
      id: youtubeId,
      // Privacy-enhanced embed: no YouTube cookies until the visitor presses play.
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  if (host === "tiktok.com" || host === "vm.tiktok.com" || host === "vt.tiktok.com") {
    return { platform: "tiktok", url: url.toString() };
  }
  return null;
}

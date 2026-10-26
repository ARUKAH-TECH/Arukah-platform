// A small, safe writing format for articles (a subset of Markdown).
// It is parsed into plain data and rendered with React components — never
// as raw HTML — so nothing typed into an article can run as code.
//
//   ## Heading            ### Sub-heading
//   **bold**  *italic*    [link text](https://example.com)
//   - bullet item         1. numbered item
//   > quote               ![image description](image address)
//
// Links must be http(s), mailto or a page on this site ("/books").
// Images must come from this site's own image storage.

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; children: Inline[] }
  | { kind: "italic"; children: Inline[] }
  | { kind: "link"; href: string; children: Inline[] };

export type Block =
  | { kind: "heading"; level: 2 | 3; text: string; id: string }
  | { kind: "paragraph"; lines: Inline[][] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "quote"; lines: Inline[][] }
  | { kind: "image"; src: string; alt: string };

export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href; // a page on this site
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return href;
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    // not a URL
  }
  return null;
}

/** Only images stored in this site's media bucket (articles/ folder). */
export function safeImage(raw: string, mediaBase: string): string | null {
  const src = raw.trim();
  const prefix = `${mediaBase.replace(/\/$/, "")}/storage/v1/object/public/media/articles/`;
  if (!src.startsWith(prefix)) return null;
  return /^[0-9a-f-]{36}\.webp$/.test(src.slice(prefix.length)) ? src : null;
}

const INLINE = /(\*\*([^*]+?)\*\*)|(\*([^*\s][^*]*?)\*)|(_([^_\s][^_]*?)_)|(\[([^\]]{1,300})\]\(([^)\s]{1,800})\))/;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  let guard = 0;
  while (rest && guard++ < 2000) {
    const match = rest.match(INLINE);
    if (!match || match.index === undefined) {
      out.push({ kind: "text", text: rest });
      break;
    }
    if (match.index > 0) out.push({ kind: "text", text: rest.slice(0, match.index) });
    if (match[1]) out.push({ kind: "bold", children: parseInline(match[2]) });
    else if (match[3]) out.push({ kind: "italic", children: parseInline(match[4]) });
    else if (match[5]) out.push({ kind: "italic", children: parseInline(match[6]) });
    else if (match[7]) {
      const href = safeHref(match[9]);
      if (href) out.push({ kind: "link", href, children: parseInline(match[8]) });
      else out.push({ kind: "text", text: match[8] }); // unsafe link: keep the words only
    }
    rest = rest.slice(match.index + match[0].length);
  }
  return out;
}

export function slugifyHeading(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[*_[\]()]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section"
  );
}

const IMAGE_LINE = /^!\[([^\]]{0,300})\]\(([^)\s]{1,800})\)$/;

export function parseArticle(source: string, mediaBase: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").split("\n");
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", lines: paragraph.map(parseInline) });
    if (quote.length) blocks.push({ kind: "quote", lines: quote.map(parseInline) });
    if (list) blocks.push({ kind: "list", ordered: list.ordered, items: list.items.map(parseInline) });
    paragraph = [];
    quote = [];
    list = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = line.match(/^(#{2,3})\s+(.+)$/) ?? line.match(/^(#)\s+(.+)$/);
    if (heading) {
      flush();
      const text = heading[2].replace(/[*_]/g, "").trim();
      let id = slugifyHeading(text);
      const seen = usedIds.get(id) ?? 0;
      usedIds.set(id, seen + 1);
      if (seen) id = `${id}-${seen + 1}`;
      blocks.push({ kind: "heading", level: heading[1].length === 3 ? 3 : 2, text, id });
      continue;
    }
    const image = line.match(IMAGE_LINE);
    if (image) {
      flush();
      const src = safeImage(image[2], mediaBase);
      if (src) blocks.push({ kind: "image", src, alt: image[1].trim() });
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d{1,3}[.)]\s+(.+)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (paragraph.length || quote.length || (list && list.ordered !== ordered)) flush();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    const quoted = line.match(/^>\s?(.*)$/);
    if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1]);
      continue;
    }
    if (list || quote.length) flush();
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Plain words, for excerpts, reading time and search. */
export function plainText(source: string) {
  return source
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\s*(?:[-*•]|\d{1,3}[.)]|>)\s+/gm, "")
    .replace(/[*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(source: string) {
  const words = plainText(source).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Images in the text, so the editor can list/verify them. */
export function imagePaths(source: string, mediaBase: string): string[] {
  const prefix = `${mediaBase.replace(/\/$/, "")}/storage/v1/object/public/media/`;
  return [...source.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((m) => safeImage(m[1], mediaBase))
    .filter((src): src is string => Boolean(src))
    .map((src) => src.slice(prefix.length));
}

// Turns the text of one PDF page (as pdf.js reports it) into clean
// paragraphs for the online reader: lines are rebuilt from their positions,
// wrapped lines are joined, page numbers and dot leaders are removed.
// Pure functions — used in the admin (browser) and in tests (Node).

export interface PdfTextItem {
  str: string;
  /** pdf.js transform: [a, b, c, d, x, y] */
  transform: number[];
  height?: number;
  hasEOL?: boolean;
}

interface Line {
  text: string;
  y: number;
  size: number;
}

const HEADING =
  /^(chapter\s+\d+\b.*|preface|introduction|epilogue|prologue|dedication|acknowledge?ments?|glossary|questions|contents|table of contents|the end|foreword|conclusion|about the author)$/i;

export function isHeading(text: string) {
  const t = text.trim();
  return HEADING.test(t) && t.length <= 80 && !t.endsWith("…"); // "…" = a contents-page line
}

function buildLines(items: PdfTextItem[]): Line[] {
  const lines: Line[] = [];
  let current: Line | null = null;
  for (const item of items) {
    const y = item.transform?.[5] ?? 0;
    const size = Math.abs(item.height || item.transform?.[3] || 10);
    if (current && Math.abs(current.y - y) > size * 0.5 && item.str.trim()) {
      lines.push(current);
      current = null;
    }
    if (!current) current = { text: "", y, size };
    current.text += item.str;
    if (item.hasEOL) {
      lines.push(current);
      current = null;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((line) => ({ ...line, text: line.text.replace(/\s+/g, " ").trim() }))
    .filter((line) => line.text && !/^\d{1,4}$/.test(line.text));
}

function cleanText(text: string) {
  return text
    .replace(/\.{4,}\s*\d*/g, " … ")
    .replace(/…(\s*…)+/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function join(a: string, b: string) {
  if (/[A-Za-z]-$/.test(a) && /^[a-z]/.test(b)) return a.slice(0, -1) + b;
  return `${a} ${b}`;
}

/** One page → paragraphs separated by a blank line. */
export function pageToText(items: PdfTextItem[]): string {
  const lines = buildLines(items);
  if (lines.length === 0) return "";

  const maxLen = Math.max(...lines.map((line) => line.text.length));
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i - 1].y - lines[i].y;
    if (gap > 0) gaps.push(gap);
  }
  gaps.sort((a, b) => a - b);
  const normalGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;

  const paragraphs: string[] = [];
  let current = "";
  lines.forEach((line, i) => {
    const prev = lines[i - 1];
    let newParagraph = i === 0;
    if (prev) {
      const gap = prev.y - line.y;
      const prevEndsSentence = /[.!?:"”’)]$/.test(prev.text);
      const prevShort = prev.text.length < maxLen * 0.8;
      if (normalGap && gap > normalGap * 1.5) newParagraph = true;
      else if (gap < 0) newParagraph = true; // moved up the page: a new block
      else if (isHeading(prev.text) || isHeading(line.text)) newParagraph = true;
      else if (prevEndsSentence && prevShort) newParagraph = true;
      else if (prevEndsSentence && /^["“‘']/.test(line.text)) newParagraph = true; // a new speaker
      else if (prevEndsSentence && /^[A-Z][A-Za-z' -]{1,40}:\s/.test(line.text)) newParagraph = true; // "Term: meaning"
      else if (/\.{4,}\s*\d*$/.test(prev.text)) newParagraph = true; // contents line with page number
      else if (/^\d{1,3}[.)]\s/.test(line.text)) newParagraph = true; // numbered question or list item
      else if (Math.abs(line.size - prev.size) > Math.max(line.size, prev.size) * 0.25) newParagraph = true;
    }
    if (newParagraph) {
      if (current) paragraphs.push(current);
      current = line.text;
    } else {
      current = join(current, line.text);
    }
  });
  if (current) paragraphs.push(current);
  return paragraphs
    .map(cleanText)
    .filter((paragraph) => paragraph && paragraph !== "…")
    .join("\n\n");
}

/** Glossary entries ("Term: meaning") found on any page under a "Glossary" heading. */
export function findGlossary(pages: string[]): Record<string, string> {
  const glossary: Record<string, string> = {};
  let inGlossary = false;
  for (const page of pages) {
    for (const paragraph of page.split(/\n\n+/)) {
      if (isHeading(paragraph)) {
        inGlossary = /^glossary$/i.test(paragraph.trim());
        continue;
      }
      if (!inGlossary) continue;
      const match = paragraph.match(/^([A-Z][A-Za-z' -]{1,40}):\s+(.{3,300})$/);
      if (match) glossary[match[1].trim()] = match[2].trim();
    }
  }
  return glossary;
}

/** Text the speech engine reads: no ellipsis leaders, no stray symbols. */
export function speakable(text: string) {
  return text.replace(/…/g, ", ").replace(/[_*#]/g, " ").replace(/\s+/g, " ").trim();
}

/** Short chunks so phone speech engines don't cut off long paragraphs. */
export function speechChunks(text: string, max = 220): string[] {
  const sentences = speakable(text).match(/[^.!?]+[.!?"”’)]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > max && current) {
      chunks.push(current.trim());
      current = "";
    }
    if (sentence.length > max) {
      for (const part of sentence.replace(/,\s+/g, ",\u0000").split("\u0000")) {
        if ((current + part).length > max && current) {
          chunks.push(current.trim());
          current = "";
        }
        current += part + " ";
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

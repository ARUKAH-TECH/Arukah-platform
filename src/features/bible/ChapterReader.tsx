"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readAloud, speechSupported } from "@/features/bible/speech";
import { BIBLE_VERSIONS, type BibleVersionId } from "@/config/bibleVersions";
import { SharePicture } from "@/components/ui/SharePicture";

const LAST = "zivarukah-bible:last";
const MARKS = "zivarukah-bible:highlights";
const SIZE = "zivarukah-bible:size";
const VERSION = "zivarukah-bible:version";
const SITE = "https://zivarukah.com";

function readJson<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? "null") as T) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or full: fine
  }
}

const SIZES = ["text-base leading-8", "text-lg leading-9", "text-xl leading-10", "text-2xl leading-[2.75rem]"];

/** One chapter: tap verses to copy, share or highlight them; listen to the chapter. Everything is kept on this device. */
export function ChapterReader({ slug, label, chapter, verses: kjv }: { slug: string; label: string; chapter: number; verses: string[] }) {
  const [version, setVersion] = useState<BibleVersionId>("kjv");
  const [other, setOther] = useState<string[] | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const verses = version === "kjv" || !other ? kjv : other;
  const short = BIBLE_VERSIONS.find((v) => v.id === version)?.short ?? "KJV";
  const key = `${slug}.${chapter}`;
  const [selected, setSelected] = useState<number[]>([]);
  const [marks, setMarks] = useState<number[]>([]);
  const [size, setSize] = useState(1);
  const [reading, setReading] = useState<number | null>(null);
  const [canSpeak, setCanSpeak] = useState(false);
  const [note, setNote] = useState("");
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    setCanSpeak(speechSupported());
    setMarks(readJson<Record<string, number[]>>(MARKS, {})[key] ?? []);
    setSize(Math.min(3, Math.max(0, readJson<number>(SIZE, 1))));
    const saved = readJson<string>(VERSION, "kjv");
    if (BIBLE_VERSIONS.some((v) => v.id === saved)) setVersion(saved as BibleVersionId);
    writeJson(LAST, { slug, chapter, label, at: Date.now() });
    return () => stop.current?.();
  }, [key, slug, chapter, label]);

  // Another version: load this book's text once (it is then cached for offline use).
  useEffect(() => {
    if (version === "kjv") return setOther(null);
    let cancelled = false;
    setLoadingVersion(true);
    fetch(`/bible-versions/${version}/${slug}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<string[][]>) : Promise.reject()))
      .then((book) => !cancelled && setOther(book[chapter - 1] ?? null))
      .catch(() => !cancelled && (setOther(null), setVersion("kjv")))
      .finally(() => !cancelled && setLoadingVersion(false));
    return () => {
      cancelled = true;
    };
  }, [version, slug, chapter]);

  function chooseVersion(id: BibleVersionId) {
    stop.current?.();
    setReading(null);
    setVersion(id);
    writeJson(VERSION, id);
  }

  // Keep the verse being read on screen.
  useEffect(() => {
    if (reading !== null) document.getElementById(`v${reading + 1}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [reading]);

  const toggle = (n: number) => setSelected((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)));

  const refText = useCallback(() => {
    if (!selected.length) return label;
    const ranges: string[] = [];
    let start = selected[0];
    let prev = start;
    for (const n of [...selected.slice(1), -1]) {
      if (n !== prev + 1) {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = n;
      }
      prev = n;
    }
    return `${label}:${ranges.join(",")}`;
  }, [selected, label]);

  const selectedText = () => selected.map((n) => `${n} ${verses[n - 1]}`).join(" ");
  const flash = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote(""), 1800);
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${selectedText()}\n— ${refText()} (${short})`);
      flash("Copied ✓");
    } catch {
      flash("Couldn't copy");
    }
  }
  // Ranges like 16-17_19 ("_" instead of "," so WhatsApp keeps the whole link).
  const shareLink = () => `/q/v/${slug}/${chapter}/${refText().split(":").pop()?.replace(/,/g, "_") ?? "1"}/${version}`;
  function share() {
    const message = `📖 *${refText()}* (${short})\n\n${selected.map((n) => verses[n - 1]).join(" ")}\n\n📖 Open *R.O.M Bible Guide* on our homepage 👇\n${SITE}${shareLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }
  function highlight() {
    const all = readJson<Record<string, number[]>>(MARKS, {});
    const current = all[key] ?? [];
    const allMarked = selected.every((n) => current.includes(n));
    const next = allMarked ? current.filter((n) => !selected.includes(n)) : [...new Set([...current, ...selected])].sort((a, b) => a - b);
    if (next.length) all[key] = next;
    else delete all[key];
    writeJson(MARKS, all);
    setMarks(next);
    setSelected([]);
  }
  function listen(from = 0) {
    stop.current?.();
    setSelected([]);
    stop.current = readAloud(
      verses.slice(from).map((t) => t || " "),
      (i) => setReading(from + i),
      () => {
        setReading(null);
        stop.current = null;
      },
    );
  }
  function stopReading() {
    stop.current?.();
    stop.current = null;
    setReading(null);
  }
  function resize(by: number) {
    const next = Math.min(3, Math.max(0, size + by));
    setSize(next);
    writeJson(SIZE, next);
  }

  return (
    <div>
      <div className="sticky top-[61px] z-30 -mx-4 flex flex-wrap items-center gap-2 border-b border-black/10 bg-background/95 px-4 py-2 backdrop-blur dark:border-white/10">
        {canSpeak &&
          (reading === null ? (
            <button type="button" onClick={() => listen(0)} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary">
              🔊 Listen
            </button>
          ) : (
            <button type="button" onClick={stopReading} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
              ⏹ Stop
            </button>
          ))}
        <label className="flex items-center gap-1 text-sm">
          <span className="sr-only">Bible version</span>
          <select
            value={version}
            onChange={(e) => chooseVersion(e.target.value as BibleVersionId)}
            className="rounded-full border border-black/15 bg-white px-3 py-2 text-sm font-semibold dark:border-white/15 dark:bg-zinc-900"
          >
            {BIBLE_VERSIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.short}
              </option>
            ))}
          </select>
        </label>
        {loadingVersion && <span className="text-xs text-foreground/60">Loading…</span>}
        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => resize(-1)} aria-label="Smaller text" className="h-9 w-9 rounded-full border border-black/15 text-sm font-bold dark:border-white/15">
            A−
          </button>
          <button type="button" onClick={() => resize(1)} aria-label="Bigger text" className="h-9 w-9 rounded-full border border-black/15 text-base font-bold dark:border-white/15">
            A+
          </button>
        </span>
      </div>

      <p className="mt-4 text-xs text-foreground/60">
        {BIBLE_VERSIONS.find((v) => v.id === version)?.name}. Tap a verse to copy, share, highlight or listen from there.
      </p>
      <div className={`mt-4 font-serif ${SIZES[size]}`}>
        {verses.map((text, i) => {
          const n = i + 1;
          const isSel = selected.includes(n);
          const isMark = marks.includes(n);
          return (
            <span
              key={n}
              id={`v${n}`}
              role="button"
              tabIndex={0}
              onClick={() => toggle(n)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(n))}
              className={`scroll-mt-32 cursor-pointer rounded px-0.5 target:bg-amber-100 dark:target:bg-amber-900/40 ${reading === i ? "bg-sky-100 dark:bg-sky-900/40" : ""} ${isMark ? "bg-yellow-200/80 dark:bg-yellow-700/40" : ""} ${isSel ? "underline decoration-brand-primary decoration-2 underline-offset-4" : ""}`}
            >
              <sup className="mr-1 font-sans text-[0.65em] font-bold text-brand-primary-text">{n}</sup>
              {text || <em className="text-sm text-foreground/50">(not in this version: some ancient manuscripts leave it out)</em>}{" "}
            </span>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
            <p className="mr-auto text-sm font-semibold">{refText()}</p>
            <button type="button" onClick={copy} className="rounded-full border border-black/15 px-3 py-2 text-sm dark:border-white/15">
              📋 Copy
            </button>
            <button type="button" onClick={share} className="rounded-full bg-[#25D366] px-3 py-2 text-sm font-semibold text-black">
              WhatsApp
            </button>
            <SharePicture
              image={`/api/share-card?b=${slug}&c=${chapter}&v=${selected.join(",")}&t=${version}`}
              text={`📖 ${refText()} (${short})\nOpen R.O.M Bible Guide on our homepage 👇\n${SITE}${shareLink()}`}
              fileName={`${slug}-${chapter}`}
            />
            <button type="button" onClick={highlight} className="rounded-full bg-yellow-200 px-3 py-2 text-sm font-semibold text-black">
              🖍 Highlight
            </button>
            {canSpeak && (
              <button type="button" onClick={() => listen(selected[0] - 1)} className="rounded-full border border-black/15 px-3 py-2 text-sm dark:border-white/15">
                🔊 From here
              </button>
            )}
            <button type="button" onClick={() => setSelected([])} aria-label="Close" className="h-9 w-9 rounded-full bg-black/5 dark:bg-white/10">
              ✕
            </button>
          </div>
          {note && <p className="mx-auto mt-1 max-w-3xl text-xs text-emerald-700">{note}</p>}
        </div>
      )}
    </div>
  );
}

/** "Continue reading John 3" — from this device. */
export function ContinueReading() {
  const [last, setLast] = useState<{ slug: string; chapter: number; label: string } | null>(null);
  useEffect(() => setLast(readJson(LAST, null)), []);
  if (!last) return null;
  return (
    <a
      href={`/bible/${last.slug}/${last.chapter}`}
      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#14110c] shadow"
    >
      📖 Continue reading {last.label}
    </a>
  );
}

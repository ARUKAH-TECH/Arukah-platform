"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findGlossary, isHeading, speechChunks } from "@/lib/bookText";

interface Props {
  title: string;
  author: string;
  pages: string[];
  highlights: string[];
  storageKey: string;
}

type Block =
  | { kind: "heading"; text: string; eyebrow: string | null }
  | { kind: "end"; text: string }
  | { kind: "para"; text: string; dropCap: boolean; dialogue: boolean };

/** Turns a page's paragraphs into styled blocks (chapter titles, drop caps, dialogue). */
function toBlocks(page: string, afterHeading: { value: boolean }): Block[] {
  return page
    .split(/\n\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text): Block => {
      if (/^the end\.?$/i.test(text)) return { kind: "end", text };
      if (isHeading(text)) {
        afterHeading.value = true;
        const chapter = text.match(/^(chapter\s+\d+)\s*[:.-]\s*(.+)$/i);
        return chapter ? { kind: "heading", eyebrow: chapter[1], text: chapter[2] } : { kind: "heading", eyebrow: null, text };
      }
      const dropCap = afterHeading.value && /^[A-Za-z]/.test(text);
      afterHeading.value = false;
      return { kind: "para", text, dropCap, dialogue: /^["“‘]/.test(text) };
    });
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const RATES = [0.75, 1, 1.25, 1.5];

export function Reader({ title, author, pages, highlights, storageKey }: Props) {
  const glossary = useMemo(() => findGlossary(pages), [pages]);
  const glossaryStart = useMemo(() => pages.findIndex((p) => /^glossary$/im.test(p.split(/\n\n/)[0] ?? "")), [pages]);
  const blocks = useMemo(() => {
    const state = { value: false };
    return pages.map((page) => toBlocks(page, state));
  }, [pages]);

  // Speech state
  const [supported, setSupported] = useState(false);
  useEffect(() => setSupported("speechSynthesis" in window), []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState<{ page: number; block: number } | null>(null);
  const [status, setStatus] = useState("");
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const token = useRef(0);
  const settings = useRef({ rate: 1, voiceName: "" });
  settings.current = { rate, voiceName };

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const english = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
      setVoices(english.length ? english : all);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  // Remember the last page read on this device.
  useEffect(() => {
    if (!position) return;
    try {
      localStorage.setItem(`${storageKey}:page`, String(position.page));
    } catch {
      // Private browsing — not remembered.
    }
  }, [position, storageKey]);

  const speakableBlocks = useCallback(
    (pageIndex: number) =>
      blocks[pageIndex]
        .map((block, index) => ({ block, index }))
        .filter(({ block }) => block.text.replace(/[…\s]/g, "").length > 0),
    [blocks],
  );

  const scrollTo = useCallback((pageIndex: number, blockIndex: number) => {
    document.getElementById(`b-${pageIndex}-${blockIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const speakFrom = useCallback(
    (pageIndex: number, blockIndex: number) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const run = ++token.current;

      // Find the next block with words, moving across pages to the end.
      const finish = () => {
        setPlaying(false);
        setPaused(false);
        setPosition(null);
        setStatus("Finished reading the book.");
      };
      let page = pageIndex;
      if (page >= pages.length) return finish();
      let list = speakableBlocks(page);
      let at = list.findIndex(({ index }) => index >= blockIndex);
      while (at === -1) {
        page += 1;
        if (page >= pages.length) return finish();
        list = speakableBlocks(page);
        at = list.length ? 0 : -1;
      }
      const { block, index } = list[at];
      setPosition({ page, block: index });
      setPlaying(true);
      setPaused(false);
      if (index === list[0].index || blockIndex === 0) setStatus(`Reading page ${page + 1} of ${pages.length}`);
      scrollTo(page, index);

      const prefix = block.kind === "heading" && block.eyebrow ? `${block.eyebrow}. ` : "";
      const chunks = speechChunks(prefix + block.text);
      const next = () => {
        if (run !== token.current) return;
        const following = list[at + 1];
        if (following) speakFrom(page, following.index);
        else speakFrom(page + 1, 0);
      };
      chunks.forEach((chunk, i) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.rate = settings.current.rate;
        const voice = window.speechSynthesis.getVoices().find((v) => v.name === settings.current.voiceName);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = "en-GB";
        }
        if (i === chunks.length - 1) utterance.onend = next;
        utterance.onerror = (event) => {
          if (run !== token.current || event.error === "interrupted" || event.error === "canceled") return;
          next();
        };
        synth.speak(utterance);
      });
    },
    [pages.length, scrollTo, speakableBlocks, supported],
  );

  const stop = useCallback(() => {
    token.current += 1;
    if (supported) window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setStatus("Stopped.");
  }, [supported]);

  const togglePause = useCallback(() => {
    if (!supported) return;
    if (!playing) {
      let start = 0;
      try {
        start = Math.min(pages.length - 1, Math.max(0, Number(localStorage.getItem(`${storageKey}:page`)) || 0));
      } catch {
        start = 0;
      }
      speakFrom(position?.page ?? start, position?.block ?? 0);
      return;
    }
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setStatus("Reading.");
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
      setStatus("Paused.");
    }
  }, [pages.length, paused, playing, position, speakFrom, storageKey, supported]);

  // Space bar plays / pauses (when not typing in a box).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.code !== "Space" || ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      event.preventDefault();
      togglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePause]);

  // Changing speed or voice takes effect from the current paragraph.
  function changeSetting(apply: () => void) {
    apply();
    if (playing && !paused && position) setTimeout(() => speakFrom(position.page, position.block), 0);
  }

  const highlightPattern = useMemo(() => {
    const clean = highlights.map((h) => h.trim()).filter((h) => h.length > 8);
    return clean.length ? new RegExp(`(${clean.map(escapeRegExp).join("|")})`, "gi") : null;
  }, [highlights]);
  const termPattern = useMemo(() => {
    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    return terms.length ? new RegExp(`\\b(${terms.map(escapeRegExp).join("|")})\\b`, "i") : null;
  }, [glossary]);

  /** Text with catchy lines marked and the first glossary word made tappable. */
  function renderText(text: string, key: string, allowTerms: boolean) {
    const parts = highlightPattern ? text.split(highlightPattern) : [text];
    let termUsed = !allowTerms;
    return parts.map((part, i) => {
      if (!part) return null;
      if (highlightPattern && i % 2 === 1) {
        return (
          <mark key={i} className="rounded bg-amber-200/70 px-0.5 font-semibold text-inherit dark:bg-amber-400/30">
            {part}
          </mark>
        );
      }
      if (!termUsed && termPattern) {
        const match = part.match(termPattern);
        if (match && match.index !== undefined) {
          termUsed = true;
          const word = match[0];
          const term = Object.keys(glossary).find((t) => t.toLowerCase() === word.toLowerCase())!;
          const id = `${key}-${i}`;
          const open = openTerm === id;
          return (
            <Fragment key={i}>
              {part.slice(0, match.index)}
              <button
                type="button"
                onClick={() => setOpenTerm(open ? null : id)}
                aria-expanded={open}
                className="underline decoration-brand-primary-text decoration-dotted decoration-2 underline-offset-4"
              >
                {word}
              </button>
              {open && (
                <span role="note" className="mx-1 inline-block rounded-lg bg-brand-primary/10 px-2 py-0.5 text-sm not-italic">
                  <strong>{term}:</strong> {glossary[term]}
                </span>
              )}
              {part.slice(match.index + word.length)}
            </Fragment>
          );
        }
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
  }

  return (
    <div className="pb-40">
      {highlights.length > 0 && (
        <aside aria-label="Lines to remember" className="mb-10 rounded-2xl bg-brand-primary/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Lines to remember</p>
          <ul className="mt-3 flex flex-col gap-2">
            {highlights.slice(0, 3).map((line) => (
              <li key={line} className="font-serif text-lg italic leading-7">
                “{line}”
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="flex flex-col gap-8">
        {blocks.map((pageBlocks, pageIndex) => (
          <section
            key={pageIndex}
            aria-label={`Page ${pageIndex + 1}`}
            className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-10 dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-4 font-serif text-[1.15rem] leading-8">
              {pageBlocks.map((block, blockIndex) => {
                const current = position?.page === pageIndex && position.block === blockIndex;
                const ring = current ? "rounded-lg bg-brand-primary/15 ring-2 ring-brand-primary/40" : "";
                const id = `b-${pageIndex}-${blockIndex}`;
                const allowTerms = glossaryStart === -1 || pageIndex < glossaryStart;
                if (block.kind === "heading") {
                  return (
                    <h2 key={blockIndex} id={id} aria-current={current || undefined} className={`mt-2 text-center font-sans ${ring}`}>
                      {block.eyebrow && (
                        <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-brand-primary-text">{block.eyebrow}</span>
                      )}
                      <span className="mt-1 block text-2xl font-bold tracking-tight">{block.text}</span>
                      <span aria-hidden="true" className="mx-auto mt-3 block h-0.5 w-12 rounded bg-brand-primary" />
                    </h2>
                  );
                }
                if (block.kind === "end") {
                  return (
                    <p key={blockIndex} id={id} className={`mt-4 text-center font-sans text-sm font-bold tracking-[0.3em] ${ring}`}>
                      ✦ THE END ✦
                    </p>
                  );
                }
                return (
                  <p
                    key={blockIndex}
                    id={id}
                    aria-current={current || undefined}
                    className={`${ring} ${block.dialogue ? "border-l-2 border-brand-primary/40 pl-3" : ""} ${
                      block.dropCap
                        ? "first-letter:float-left first-letter:mr-2 first-letter:font-sans first-letter:text-5xl first-letter:font-bold first-letter:leading-[0.9] first-letter:text-brand-primary-text"
                        : ""
                    }`}
                  >
                    {renderText(block.text, id, allowTerms)}
                  </p>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between font-sans text-xs text-foreground/60">
              <span>
                Page {pageIndex + 1} of {pages.length}
              </span>
              {supported && (
                <button type="button" onClick={() => speakFrom(pageIndex, 0)} className="rounded-full border border-black/15 px-3 py-1 dark:border-white/15">
                  🔊 Read aloud from this page
                </button>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Read-aloud controls, always at the bottom of the screen. */}
      <div role="region" aria-label="Read aloud" className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-background/95 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
          {supported ? (
            <>
              <button
                type="button"
                onClick={() => speakFrom(0, 0)}
                aria-label="Read aloud from page 1"
                className="rounded-full border border-black/15 px-3 py-2 text-sm font-medium dark:border-white/15"
              >
                ⏮ From page 1
              </button>
              <button
                type="button"
                onClick={togglePause}
                aria-label={!playing ? "Read aloud" : paused ? "Continue reading aloud" : "Pause reading aloud"}
                className="min-w-[8.5rem] rounded-full bg-brand-primary px-5 py-2.5 text-base font-semibold text-brand-on-primary"
              >
                {!playing ? "▶ Read aloud" : paused ? "▶ Continue" : "⏸ Pause"}
              </button>
              {playing && (
                <button type="button" onClick={stop} aria-label="Stop reading aloud" className="rounded-full border border-black/15 px-3 py-2 text-sm dark:border-white/15">
                  ⏹ Stop
                </button>
              )}
              <label className="flex items-center gap-1 text-xs">
                Speed
                <select
                  value={rate}
                  onChange={(event) => changeSetting(() => setRate(Number(event.target.value)))}
                  className="rounded border border-black/15 bg-transparent px-1 py-1 dark:border-white/15"
                >
                  {RATES.map((r) => (
                    <option key={r} value={r}>
                      {r}×
                    </option>
                  ))}
                </select>
              </label>
              {voices.length > 1 && (
                <label className="flex items-center gap-1 text-xs">
                  Voice
                  <select
                    value={voiceName}
                    onChange={(event) => changeSetting(() => setVoiceName(event.target.value))}
                    className="max-w-[9rem] rounded border border-black/15 bg-transparent px-1 py-1 dark:border-white/15"
                  >
                    <option value="">Default</option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name.replace(/^(Google|Microsoft)\s+/, "")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          ) : (
            <p className="text-sm">Read aloud isn&apos;t supported in this browser. Try Chrome.</p>
          )}
          <p role="status" aria-live="polite" className="w-full text-xs text-foreground/60 sm:ml-auto sm:w-auto">
            {status || `${title}${author ? ` by ${author}` : ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}

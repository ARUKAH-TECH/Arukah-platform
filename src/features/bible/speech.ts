"use client";

// Reading aloud with the phone's or computer's own voice (no internet needed on most devices).

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function voice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /en[-_]GB/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang)) ?? null;
}

/** Reads the texts one after another; onEach tells which one is being read. Returns a stop function. */
export function readAloud(texts: string[], onEach: (index: number) => void, onDone: () => void, rate = 0.9) {
  const synth = window.speechSynthesis;
  synth.cancel();
  let stopped = false;
  const v = voice();
  const next = (i: number) => {
    if (stopped) return;
    if (i >= texts.length) return onDone();
    onEach(i);
    const u = new SpeechSynthesisUtterance(texts[i]);
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-GB";
    u.rate = rate;
    u.onend = () => next(i + 1);
    u.onerror = () => {
      if (!stopped) onDone();
    };
    synth.speak(u);
  };
  next(0);
  return () => {
    stopped = true;
    synth.cancel();
  };
}

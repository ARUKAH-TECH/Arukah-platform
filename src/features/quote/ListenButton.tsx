"use client";

import { useEffect, useState } from "react";

/** Reads a short text aloud with the phone's own voice. Hidden where speech isn't available. */
export function ListenButton({ text, dark = false }: { text: string; dark?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const voice = voices.find((v) => /en[-_]GB/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang ?? "en-GB";
    utterance.rate = 0.92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition hover:scale-105 ${
        dark ? "bg-white text-[#14110c]" : "bg-brand-primary text-brand-on-primary"
      }`}
    >
      <span aria-hidden="true">{speaking ? "⏹" : "🔊"}</span>
      {speaking ? "Stop" : "Listen"}
    </button>
  );
}

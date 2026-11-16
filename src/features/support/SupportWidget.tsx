"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { matchFaq } from "@/features/support/faq";
import { ASSISTANT_LINKS } from "@/features/support/assistantLinks";
import { whatsappLink } from "@/config/forms";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  links?: string[];
  whatsapp?: string;
}

const GREETING: ChatMessage = {
  role: "bot",
  text: "Hello, you are welcome to ZIVARUKAH VENTURES! 👋 I'm the AI assistant. Ask me about websites and systems (ARUKAH TECH), footwear and branded wear (ARUKAH WEAR), ZIVA classes, the free ZIVA Learning app, books, programmes or the ministry.",
};

const SUGGESTIONS = ["I need a website", "Price of footwear?", "Classes for my child", "What is ZIVARUKAH?"];

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1).map((m) => ({ role: m.role, text: m.text })) }),
      });
      const data = (await res.json()) as { reply?: string; links?: string[]; whatsapp?: string };
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || matchFaq(question), links: data.links, whatsapp: data.whatsapp }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: matchFaq(question) }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-[30rem] max-h-[75vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold">ZIVARUKAH Assistant</p>
              <p className="text-[11px] text-foreground/60">AI answers can be wrong · a real person replies on WhatsApp</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="text-foreground/60 hover:text-foreground">
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "bot" ? "max-w-[90%]" : "ml-auto max-w-[85%]"}>
                <div
                  className={`whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    message.role === "bot" ? "bg-black/5 dark:bg-white/10" : "bg-brand-primary text-brand-on-primary"
                  }`}
                >
                  {message.text}
                </div>
                {(message.links?.length || message.whatsapp) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.links?.map((href) => (
                      <a key={href} href={href} className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold hover:border-brand-primary-text dark:border-white/20">
                        {ASSISTANT_LINKS[href] ?? href} →
                      </a>
                    ))}
                    {message.whatsapp && (
                      <a
                        href={whatsappLink(message.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-bold text-black"
                      >
                        💬 Continue on WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold dark:border-white/20">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {busy && <div className="w-16 rounded-2xl bg-black/5 px-3 py-2 text-sm dark:bg-white/10">…</div>}
          </div>

          <p className="px-4 pb-1 text-[11px] text-foreground/55">Please don&apos;t share personal details here. Chats are not saved.</p>
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10">
            <input
              type="text"
              value={input}
              maxLength={500}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              aria-label="Your question"
              className="min-w-0 flex-1 rounded-full border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-brand-primary-text sm:text-sm dark:border-white/15"
            />
            <button type="submit" disabled={busy} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-brand-on-primary disabled:opacity-60">
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary shadow-lg transition-transform hover:scale-105"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

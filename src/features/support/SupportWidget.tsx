"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { matchFaq } from "@/features/support/faq";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

const GREETING: ChatMessage = {
  role: "bot",
  text: "Hi! Ask me about our services (website development, footwear, ZIVA classes, media, or ministry), or how to reach us.",
};

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    const answer = matchFaq(question);
    setMessages((prev) => [...prev, { role: "user", text: question }, { role: "bot", text: answer }]);
    setInput("");
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
            <p className="text-sm font-semibold">ARUKAH Support</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-foreground/50 hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "bot"
                    ? "bg-black/5 dark:bg-white/10"
                    : "ml-auto bg-brand-primary text-brand-on-primary"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-full border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-primary-text dark:border-white/15"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-brand-on-primary"
            >
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

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, PaperPlaneTilt } from "@phosphor-icons/react";

export interface MockChatMessage {
  from: "student" | "tutor";
  text: string;
}

interface MockChatPaneProps {
  messages: MockChatMessage[];
  studentTyping: boolean;
  /** Called when the tutor sends the prepared reply. */
  onSendReply: (text: string) => void;
  replySent: boolean;
}

const PREPARED_REPLY = "Merhaba! Evet, seni gayet iyi duyuyorum. Başlayalım.";

/** Scripted chat: no transport, no real student — pure local state. */
export function MockChatPane({
  messages,
  studentTyping,
  onSendReply,
  replySent,
}: MockChatPaneProps) {
  const [draft, setDraft] = useState(PREPARED_REPLY);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, studentTyping]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || replySent) return;
    onSendReply(text);
    setDraft("");
  };

  const showSendHint =
    messages.some((message) => message.from === "student") &&
    !studentTyping &&
    !replySent &&
    Boolean(draft.trim());

  return (
    <aside
      className="pointer-events-auto z-[60] flex min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l border-line bg-surface text-ink shadow-float"
      aria-label="Ders sohbeti (temsilî)"
    >
      <div className="border-b border-line px-4 py-3 text-xs font-semibold text-ink">
        Sohbet
      </div>
      <div
        ref={scrollRef}
        data-testid="tutorial-chat-messages"
        className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              message.from === "tutor"
                ? "ml-auto bg-pink text-white"
                : "border border-line bg-paper text-ink"
            }`}
          >
            {message.from === "student" && (
              <span className="mb-0.5 block text-[10px] font-medium text-ink-mid">
                Öğrenci · Ayşe
              </span>
            )}
            {message.text}
          </div>
        ))}
        {studentTyping && (
          <div className="flex items-center gap-1 px-1 text-[10px] text-ink-mid">
            Ayşe yazıyor
            <span className="inline-flex gap-0.5">
              <span className="h-1 w-1 animate-pulse rounded-full bg-ink-mid" />
              <span className="h-1 w-1 animate-pulse rounded-full bg-ink-mid [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-pulse rounded-full bg-ink-mid [animation-delay:300ms]" />
            </span>
          </div>
        )}
      </div>
      <div
        data-testid="tutorial-chat-composer"
        className="flex shrink-0 items-center gap-2 border-t border-line bg-surface p-3"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSend();
          }}
          disabled={replySent}
          aria-label="Sohbet mesajı"
          className="min-w-0 flex-1 rounded-input border border-line bg-paper px-3 py-2 text-xs text-ink placeholder:text-ink-mid focus:outline-none focus:ring-2 focus:ring-pink disabled:opacity-60"
        />
        <div className="relative shrink-0">
          {showSendHint && (
            <span
              data-testid="tutorial-send-hint"
              aria-hidden="true"
              className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 text-pink"
            >
              <ArrowDown
                className="h-6 w-6 animate-tutorial-send-hint drop-shadow-sm motion-reduce:animate-none"
                weight="bold"
              />
            </span>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={replySent || !draft.trim()}
            aria-label="Mesajı gönder"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pink text-white transition-colors duration-[var(--duration-state)] hover:bg-pink-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-mid"
          >
            <PaperPlaneTilt className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

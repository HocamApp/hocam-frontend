"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

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

const PREPARED_REPLY = "Merhaba! Evet, seni gayet iyi duyuyorum. Başlayalım 👍";

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

  return (
    <aside
      className="pointer-events-auto z-[60] flex w-72 shrink-0 flex-col border-l border-white/10 bg-gray-900"
      aria-label="Ders sohbeti (temsilî)"
    >
      <div className="border-b border-white/10 px-3 py-2 text-xs font-medium text-gray-300">
        Sohbet
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              message.from === "tutor"
                ? "ml-auto bg-sky-600 text-white"
                : "bg-white/10 text-gray-100"
            }`}
          >
            {message.from === "student" && (
              <span className="mb-0.5 block text-[10px] font-medium text-sky-300">
                Öğrenci · Ayşe
              </span>
            )}
            {message.text}
          </div>
        ))}
        {studentTyping && (
          <div className="flex items-center gap-1 px-1 text-[10px] text-gray-400">
            Ayşe yazıyor
            <span className="inline-flex gap-0.5">
              <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400" />
              <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
              <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 p-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSend();
          }}
          disabled={replySent}
          aria-label="Sohbet mesajı"
          className="min-w-0 flex-1 rounded-md border border-white/15 bg-gray-800 px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={replySent || !draft.trim()}
          aria-label="Mesajı gönder"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500 text-white transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

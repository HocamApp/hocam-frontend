"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIChatRequest, AIChatResponse, AIIntent, sendAIChatMessage } from "@/lib/aiAssistantApi";
import { setTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: AIIntent;
  isFresh?: boolean;
  action?: { type: string; value?: string };
};

const defaultStarterPrompts = [
  "Ders linkim açılmıyor.",
  "Ödeme problemi yaşıyorum.",
  "Destek talebi nasıl açarım?",
];

const intentLabels: Record<AIIntent, string> = {
  reservation_help: "Rezervasyon",
  tutor_recommendation: "Mentor önerisi",
  study_guidance: "Çalışma planı",
  platform_faq: "Hocam bilgisi",
  support_escalation: "Destek",
  general_smalltalk: "Sohbet",
  tutor_profile_feedback: "Profil yorumu",
  tutor_pricing_guidance: "Fiyat rehberi",
  tutor_bio_draft: "Hakkımda taslağı",
  unknown: "Netleştirme",
};

interface AISupportChatWidgetProps {
  title?: string;
  welcomeMessage?: string;
  starterPrompts?: readonly string[];
  getRequestContext?: () => Pick<AIChatRequest, "surface" | "draft_profile">;
  onApplyProfileBio?: (value: string) => void;
  attentionMessage?: string;
  attentionMessages?: readonly string[];
  attentionStorageKey?: string;
  positionClassName?: string;
  panelClassName?: string;
}

export function AISupportChatWidget({
  title = "Hocam AI Destek",
  welcomeMessage = "Merhaba, ben Hocam AI Asistan. Destek, rezervasyon ve mentor konularında hızlıca yardımcı olabilirim.",
  starterPrompts = defaultStarterPrompts,
  getRequestContext,
  onApplyProfileBio,
  attentionMessage,
  attentionMessages,
  attentionStorageKey,
  positionClassName,
  panelClassName,
}: AISupportChatWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcomeMessage,
      intent: "general_smalltalk",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [showAttention, setShowAttention] = useState(false);
  const [activeAttentionMessage, setActiveAttentionMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canSend = input.trim().length > 0 && !isSending;

  useEffect(() => {
    const options = (attentionMessages?.length
      ? attentionMessages
      : attentionMessage
        ? [attentionMessage]
        : []
    ).filter(Boolean);
    if (options.length === 0) return;

    if (attentionStorageKey) {
      try {
        if (sessionStorage.getItem(attentionStorageKey)) return;
        sessionStorage.setItem(attentionStorageKey, "shown");
      } catch {
        // Storage can be unavailable in privacy modes. The nudge is still safe
        // to show for the current page visit.
      }
    }

    const selectedMessage = options[Math.floor(Math.random() * options.length)];
    setActiveAttentionMessage(selectedMessage);

    const showTimeout = window.setTimeout(() => setShowAttention(true), 500);
    const hideTimeout = window.setTimeout(() => setShowAttention(false), 7000);
    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [attentionMessage, attentionMessages, attentionStorageKey]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [isOpen]);

  const getAssistantAction = (response: AIChatResponse) => {
    const action = response.metadata?.action;
    if (!action || typeof action !== "object") return undefined;
    const typedAction = action as { type?: string; status?: string; theme?: Theme; value?: string };
    if (
      typedAction.type === "set_theme" &&
      typedAction.status === "completed" &&
      (typedAction.theme === "dark" || typedAction.theme === "light")
    ) {
      setTheme(typedAction.theme);
    }
    return typedAction.type
      ? { type: typedAction.type, value: typedAction.value }
      : undefined;
  };

  const submitMessage = async (rawMessage?: string) => {
    const text = (rawMessage ?? input).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      isFresh: true,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response = await sendAIChatMessage({
        message: text,
        conversation_id: conversationId,
        ...getRequestContext?.(),
      });
      const action = getAssistantAction(response);
      setConversationId(response.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          intent: response.intent,
          isFresh: true,
          action,
        },
      ]);
    } catch (err) {
      const detail =
        axios.isAxiosError(err) && err.response?.status === 429
          ? "Günlük asistan limitine ulaştın. Yarın tekrar deneyebilirsin."
          : "Asistan şu anda yanıt veremedi. Biraz sonra tekrar dene.";
      setError(detail);
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      setInput(text);
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  return (
    <div className={cn(
      "fixed right-4 z-50 flex flex-col items-end gap-3 sm:right-6",
      positionClassName ?? "bottom-4 sm:bottom-6"
    )}>
      {isOpen && (
        <section className={cn(
          "flex h-[min(680px,calc(100vh-112px))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl motion-safe:animate-message-pop sm:w-[380px]",
          panelClassName
        )}>
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">
                  {title}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  {isSending ? "Yanıt hazırlanıyor" : "Hazır"}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsOpen(false)}
              aria-label="AI destek penceresini kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[86%] rounded-lg px-3 py-2.5 text-sm leading-6 shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground",
                    message.isFresh && "motion-safe:animate-message-pop"
                  )}
                >
                  {message.intent && message.role === "assistant" && (
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {intentLabels[message.intent]}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.action?.type === "apply_profile_bio" && message.action.value && onApplyProfileBio && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full bg-background text-foreground"
                      onClick={() => onApplyProfileBio(message.action?.value ?? "")}
                    >
                      Hakkımda alanına ekle
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="grid gap-2 pt-1">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void submitMessage(prompt)}
                    disabled={isSending}
                    className="rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {isSending && <TypingIndicator name="Hocam AI" className="px-1" />}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-3">
            {error && (
              <p className="mb-3 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage();
                  }
                }}
                placeholder="Hocam AI Asistan'a yaz..."
                className="min-h-[48px] resize-none"
                maxLength={2000}
              />
              <Button type="submit" size="icon" disabled={!canSend} aria-label="Gönder">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      )}

      {!isOpen && showAttention && activeAttentionMessage && (
        <div role="status" aria-live="polite">
          <button
            type="button"
            onClick={() => {
              setShowAttention(false);
              setIsOpen(true);
            }}
            className="max-w-[260px] rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium text-foreground shadow-lg motion-safe:animate-message-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              {activeAttentionMessage}
            </span>
          </button>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl motion-safe:animate-message-pop"
        onClick={() => {
          setShowAttention(false);
          setIsOpen((value) => !value);
        }}
        aria-label={isOpen ? "AI destek penceresini kapat" : "AI destek penceresini aç"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}

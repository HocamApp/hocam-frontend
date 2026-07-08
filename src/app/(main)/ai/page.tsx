"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Bot, CalendarClock, GraduationCap, LifeBuoy, Send, Sparkles } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { cn } from "@/lib/utils";
import { setTheme, type Theme } from "@/lib/theme";
import {
  AIChatResponse,
  AIIntent,
  sendAIChatMessage,
} from "@/lib/aiAssistantApi";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: AIIntent;
};

const suggestionGroups = [
  {
    label: "Rezervasyon",
    icon: CalendarClock,
    prompts: [
      "Yaklaşan derslerimi gösterir misin?",
      "Derse nereden katılacağım?",
    ],
  },
  {
    label: "Mentor",
    icon: GraduationCap,
    prompts: [
      "TYT matematik için uygun fiyatlı hoca arıyorum.",
      "KPSS Türkçe için mentor önerir misin?",
    ],
  },
  {
    label: "Destek",
    icon: LifeBuoy,
    prompts: [
      "Ders linkim açılmıyor, ne yapmalıyım?",
      "Ödeme problemi yaşadım.",
    ],
  },
];

const intentLabels: Record<AIIntent, string> = {
  reservation_help: "Rezervasyon",
  tutor_recommendation: "Mentor önerisi",
  study_guidance: "Çalışma planı",
  platform_faq: "Hocam bilgisi",
  support_escalation: "Destek",
  general_smalltalk: "Sohbet",
  unknown: "Netleştirme",
};

function AIPageContent() {
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Merhaba, ben Hocam AI Asistan. Rezervasyon, mentor bulma ve çalışma planı konusunda yardımcı olabilirim.",
      intent: "general_smalltalk",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = input.trim().length > 0 && !isSending;

  const statusText = useMemo(() => {
    if (isSending) return "Yanıt hazırlanıyor";
    if (conversationId) return "Konuşma devam ediyor";
    return "Yeni konuşma";
  }, [conversationId, isSending]);

  const submitMessage = async (rawMessage?: string) => {
    const text = (rawMessage ?? input).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError("");
    setIsSending(true);

    try {
      const response: AIChatResponse = await sendAIChatMessage({
        message: text,
        conversation_id: conversationId,
      });
      applyAssistantAction(response);
      setConversationId(response.conversation_id);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.message,
          intent: response.intent,
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

  const applyAssistantAction = (response: AIChatResponse) => {
    const action = response.metadata?.action;
    if (!action || typeof action !== "object") return;
    const typedAction = action as { type?: string; status?: string; theme?: Theme };
    if (
      typedAction.type === "set_theme" &&
      typedAction.status === "completed" &&
      (typedAction.theme === "dark" || typedAction.theme === "light")
    ) {
      setTheme(typedAction.theme);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hocam AI Asistan
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                {statusText}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Rezervasyon, mentor önerisi ve çalışma yönlendirmesi
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-220px)] gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
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
                    "max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[76%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground"
                  )}
                >
                  {message.intent && message.role === "assistant" && (
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      {intentLabels[message.intent]}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <TypingIndicator name="Hocam AI" className="px-1" />
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-3 sm:p-4">
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
                className="min-h-[52px] resize-none"
                maxLength={2000}
              />
              <Button type="submit" size="icon" disabled={!canSend} aria-label="Gönder">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-3">
          {suggestionGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.label} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
                </div>
                <div className="space-y-2">
                  {group.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void submitMessage(prompt)}
                      disabled={isSending}
                      className="w-full rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </div>
  );
}

export default function AIPage() {
  return (
    <RouteGuard requireAuth>
      <AIPageContent />
    </RouteGuard>
  );
}

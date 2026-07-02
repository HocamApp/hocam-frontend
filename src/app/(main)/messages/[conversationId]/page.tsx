"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMessages,
  fetchConversation,
  fetchConversations,
  deleteMessage,
} from "@/lib/messagingApi";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { ConversationList } from "@/components/messaging/ConversationList";
import { BookingModal } from "@/components/lessons/BookingModal";
import type { TutorProfile } from "@/types";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Message } from "@/types";

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDaySeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(date, now)) return "Bugün";
  if (sameDay(date, yesterday)) return "Dün";
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

type ThreadItem =
  | { kind: "separator"; key: string; label: string }
  | {
      kind: "message";
      message: Message;
      groupedWithPrev: boolean;
      showTime: boolean;
    };

/** Build a flat render list with day separators and same-sender grouping. */
function buildThreadItems(messages: Message[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const date = new Date(msg.created_at);
    const newDay = !prev || !sameDay(new Date(prev.created_at), date);
    if (newDay) {
      items.push({
        kind: "separator",
        key: `sep-${msg.id}`,
        label: formatDaySeparator(msg.created_at),
      });
    }
    const groupedWithPrev =
      !newDay && !!prev && prev.sender === msg.sender;
    const showTime =
      !next ||
      next.sender !== msg.sender ||
      !sameDay(new Date(next.created_at), date);
    items.push({ kind: "message", message: msg, groupedWithPrev, showTime });
  }
  return items;
}

function ConversationContent({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentIdsRef = useRef<Set<string>>(new Set());
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // UI-ready typing indicator. Messaging is HTTP polling only, so there is no
  // realtime presence signal yet — this stays false until a backend/realtime
  // typing source exists (see TypingIndicator).
  const [isOtherTyping] = useState(false);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 30000,
    enabled: isAuthenticated,
  });

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
    enabled: isAuthenticated && !!conversationId,
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    refetchInterval: 5000,
    enabled: isAuthenticated && !!conversationId,
  });

  const allMessages = useMemo(() => {
    const serverIds = new Set((messages || []).map((m) => m.id));
    const uniqueLocal = localMessages.filter((m) => !serverIds.has(m.id));
    return [...(messages || []), ...uniqueLocal].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages, localMessages]);

  const threadItems = useMemo(() => buildThreadItems(allMessages), [allMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleMessageSent = (newMessage: Message) => {
    sentIdsRef.current.add(newMessage.id);
    setLocalMessages((prev) => [...prev, newMessage]);
  };

  const handleSelectConversation = (selectedConversationId: string) => {
    router.push(`/messages/${selectedConversationId}`);
  };

  const handleDeleteMessage = async (message: Message) => {
    if (deletingId) return;
    const confirmed = window.confirm("Bu mesaj herkes için silinsin mi?");
    if (!confirmed) return;
    setDeletingId(message.id);
    try {
      const tombstone = await deleteMessage(message.id);
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === message.id ? tombstone : m))
      );
      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      if (replyTo?.id === message.id) setReplyTo(null);
    } catch {
      toast.error("Mesaj silinemedi. Lütfen tekrar deneyin.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleJumpToReply = (messageId: string) => {
    const el = document.getElementById(`message-${messageId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const headerTitle =
    conversation?.other_participant?.display_name ?? `Konuşma #${conversationId.slice(-6).toUpperCase()}`;
  const headerAvatarUrl = conversation?.other_participant?.avatar_url;
  const tutorForBooking = conversation?.tutor_profile ?? null;
  const showBookingButton = !!tutorForBooking;
  const profileHref = tutorForBooking ? `/tutors/${tutorForBooking.id}` : null;

  return (
    <div className="flex h-[calc(100vh-64px)] w-full min-w-0 overflow-hidden">
      <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-r md:flex">
        <header className="shrink-0 border-b p-4">
          <h1 className="text-xl font-semibold">Mesajlar</h1>
        </header>
        <ConversationList
          conversations={conversations ?? []}
          selectedId={conversationId}
          currentUserId={user?.id ?? ""}
          onSelect={handleSelectConversation}
          isLoading={conversationsLoading}
        />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b p-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/messages")}
              className="text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Geri"
            >
              ←
            </button>
            {profileHref ? (
              <Link
                href={profileHref}
                className="flex min-w-0 items-center gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                title={`${headerTitle} profilini aç`}
              >
                <ParticipantAvatar name={headerTitle} avatarUrl={headerAvatarUrl} />
                <h1 className="truncate font-semibold hover:underline">{headerTitle}</h1>
              </Link>
            ) : (
              <>
                <ParticipantAvatar name={headerTitle} avatarUrl={headerAvatarUrl} />
                <h1 className="truncate font-semibold">{headerTitle}</h1>
              </>
            )}
          </div>
          {showBookingButton && (
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
              onClick={() => setIsBookingOpen(true)}
            >
              Ders rezervasyonu yap
            </button>
          )}
        </header>

        {/* Messages area — mostly-white with a subtle dot texture for depth */}
        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-background p-3 sm:p-4"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {messagesLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {!messagesLoading && messagesError && (
            <ErrorMessage message="Mesajlar yüklenemedi" />
          )}

          {!messagesLoading && !messagesError && allMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <p>Henüz mesaj yok. İlk mesajı siz gönderin!</p>
            </div>
          )}

          {!messagesLoading && !messagesError && allMessages.length > 0 && (
            <div className="flex min-w-0 flex-col">
              {threadItems.map((item) =>
                item.kind === "separator" ? (
                  <div key={item.key} className="my-3 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                ) : (
                  <MessageBubble
                    key={item.message.id}
                    message={item.message}
                    isOwnMessage={item.message.sender === user?.id}
                    isNew={sentIdsRef.current.has(item.message.id)}
                    showTime={item.showTime}
                    groupedWithPrev={item.groupedWithPrev}
                    onReply={setReplyTo}
                    onDelete={
                      item.message.sender === user?.id ? handleDeleteMessage : undefined
                    }
                    onJumpToReply={handleJumpToReply}
                  />
                )
              )}
              {isOtherTyping && <TypingIndicator name={headerTitle} />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0">
          <MessageInput
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
            disabled={!!messagesError}
            replyTo={replyTo}
            replyToName={
              replyTo
                ? replyTo.sender === user?.id
                  ? "Kendine"
                  : headerTitle
                : undefined
            }
            onCancelReply={() => setReplyTo(null)}
          />
        </div>

        {tutorForBooking && (
          <BookingModal
            tutor={tutorForBooking as TutorProfile}
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
            onSuccess={() => setIsBookingOpen(false)}
          />
        )}
      </section>
    </div>
  );
}

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  return (
    <RouteGuard requireAuth>
      <ConversationContent conversationId={params.conversationId} />
    </RouteGuard>
  );
}

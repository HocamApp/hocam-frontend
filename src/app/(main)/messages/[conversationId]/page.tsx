"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchMessages, fetchConversation } from "@/lib/messagingApi";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { TypingIndicator } from "@/components/messaging/TypingIndicator";
import { BookingModal } from "@/components/lessons/BookingModal";
import type { TutorProfile } from "@/types";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Message } from "@/types";

function ConversationContent({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentIdsRef = useRef<Set<string>>(new Set());
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  // UI-ready typing indicator. Messaging is HTTP polling only, so there is no
  // realtime presence signal yet — this stays false until a backend/realtime
  // typing source exists (see TypingIndicator).
  const [isOtherTyping] = useState(false);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleMessageSent = (newMessage: Message) => {
    sentIdsRef.current.add(newMessage.id);
    setLocalMessages((prev) => [...prev, newMessage]);
  };

  const headerTitle =
    conversation?.other_participant?.display_name ?? `Konuşma #${conversationId.slice(-6).toUpperCase()}`;
  const headerAvatarUrl = conversation?.other_participant?.avatar_url;
  const tutorForBooking = conversation?.tutor_profile ?? null;
  const showBookingButton = !!tutorForBooking;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Geri"
          >
            ←
          </button>
          <ParticipantAvatar name={headerTitle} avatarUrl={headerAvatarUrl} />
          <h1 className="font-semibold">{headerTitle}</h1>
        </div>
        {showBookingButton && (
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setIsBookingOpen(true)}
          >
            Ders rezervasyonu yap
          </button>
        )}
      </header>

      {/* Messages area — mostly-white with a subtle dot texture for depth */}
      <div
        className="flex-1 overflow-y-auto bg-background p-4"
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
          <div className="flex flex-col gap-3">
            {allMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwnMessage={msg.sender === user?.id}
                isNew={sentIdsRef.current.has(msg.id)}
              />
            ))}
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

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchMessages } from "@/lib/messagingApi";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
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
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

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
    setLocalMessages((prev) => [...prev, newMessage]);
  };

  const suffix = conversationId.slice(-6).toUpperCase();

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b p-4">
        <button
          type="button"
          onClick={() => router.push("/messages")}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Geri"
        >
          ←
        </button>
        <h1 className="font-semibold">Konuşma #{suffix}</h1>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
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
              />
            ))}
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

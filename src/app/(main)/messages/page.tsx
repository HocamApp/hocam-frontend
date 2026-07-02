"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchConversations } from "@/lib/messagingApi";
import { ConversationList } from "@/components/messaging/ConversationList";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { MessageCircle } from "lucide-react";

const CONVERSATIONS_REFETCH_INTERVAL_MS = 60_000;

function MessagesContent() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const {
    data: conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: CONVERSATIONS_REFETCH_INTERVAL_MS,
    enabled: isAuthenticated,
  });

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/messages/${conversationId}`);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full min-w-0 overflow-hidden">
      {/* Left panel */}
      <div className="flex w-full min-w-0 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r md:w-80">
        <header className="shrink-0 border-b p-4">
          <h1 className="text-xl font-semibold">Mesajlar</h1>
        </header>
        {conversationsError ? (
          <div className="p-4">
            <ErrorMessage message="Mesajlar yüklenemedi. Lütfen tekrar deneyin." />
          </div>
        ) : (
          <ConversationList
            conversations={conversations ?? []}
            selectedId={null}
            currentUserId={user?.id ?? ""}
            onSelect={handleSelectConversation}
            isLoading={conversationsLoading}
          />
        )}
      </div>

      {/* Right panel - empty state when no conversation selected */}
      <div className="hidden min-w-0 flex-1 flex-col items-center justify-center p-8 md:flex">
        <MessageCircle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 font-medium">Bir konuşma seçin</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sol taraftaki listeden bir konuşmayı seçin
        </p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <RouteGuard requireAuth>
      <MessagesContent />
    </RouteGuard>
  );
}

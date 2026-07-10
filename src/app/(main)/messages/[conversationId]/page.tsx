"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import {
  fetchMessages,
  fetchConversation,
  fetchConversations,
  fetchTypingStatus,
  updateTypingStatus,
  deleteMessage,
  blockConversationParticipant,
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const CONVERSATIONS_REFETCH_INTERVAL_MS = 60_000;
const MESSAGES_REFETCH_INTERVAL_MS = 15_000;
const TYPING_REFETCH_INTERVAL_MS = 2_500;
const TYPING_HEARTBEAT_INTERVAL_MS = 2_500;

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
  const { isAuthenticated, isTutor, user } = useAuth();
  const isPageVisible = usePageVisibility();
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentIdsRef = useRef<Set<string>>(new Set());
  const seenServerIdsRef = useRef<Set<string>>(new Set());
  const arrivingIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedServerMessagesRef = useRef(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);

  const {
    data: conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: isPageVisible ? CONVERSATIONS_REFETCH_INTERVAL_MS : false,
    enabled: isAuthenticated,
  });

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversation(conversationId),
    enabled: isAuthenticated && !!conversationId,
  });

  const blockMutation = useMutation({
    mutationFn: () => blockConversationParticipant(conversationId),
    onSuccess: () => {
      toast.success("Öğrenci engellendi.");
      setIsBlockConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast.error("İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.");
    },
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    refetchInterval: isPageVisible ? MESSAGES_REFETCH_INTERVAL_MS : false,
    enabled: isAuthenticated && !!conversationId && isPageVisible,
  });

  const { data: typingStatus } = useQuery({
    queryKey: ["typing-status", conversationId],
    queryFn: () => fetchTypingStatus(conversationId),
    refetchInterval: isPageVisible ? TYPING_REFETCH_INTERVAL_MS : false,
    enabled: isAuthenticated && !!conversationId && isPageVisible,
  });

  const isOtherTyping = typingStatus?.is_typing ?? false;

  useEffect(() => {
    if (!isAuthenticated || !conversationId || !isPageVisible) return;
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
  }, [conversationId, isAuthenticated, isPageVisible, queryClient]);

  useEffect(() => {
    seenServerIdsRef.current = new Set();
    arrivingIdsRef.current = new Set();
    hasLoadedServerMessagesRef.current = false;
    sentIdsRef.current = new Set();
    setLocalMessages([]);
  }, [conversationId]);

  useEffect(() => {
    if (!messages) return;
    const nextIds = new Set(messages.map((message) => message.id));
    if (!hasLoadedServerMessagesRef.current) {
      seenServerIdsRef.current = nextIds;
      hasLoadedServerMessagesRef.current = true;
      return;
    }
    for (const message of messages) {
      if (!seenServerIdsRef.current.has(message.id)) {
        arrivingIdsRef.current.add(message.id);
      }
    }
    seenServerIdsRef.current = nextIds;
  }, [messages]);

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
  }, [allMessages, isOtherTyping]);

  useEffect(() => {
    if (!isAuthenticated || !conversationId || !isPageVisible) return;
    if (!isComposing) {
      updateTypingStatus(conversationId, false).catch(() => {});
      return;
    }
    updateTypingStatus(conversationId, true).catch(() => {});
    const intervalId = window.setInterval(() => {
      updateTypingStatus(conversationId, true).catch(() => {});
    }, TYPING_HEARTBEAT_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
      updateTypingStatus(conversationId, false).catch(() => {});
    };
  }, [conversationId, isAuthenticated, isComposing, isPageVisible]);

  const handleMessageSent = (newMessage: Message) => {
    sentIdsRef.current.add(newMessage.id);
    setLocalMessages((prev) => [...prev, newMessage]);
  };

  const handleSelectConversation = (selectedConversationId: string) => {
    router.push(`/messages/${selectedConversationId}`);
  };

  const handleDeleteMessage = (message: Message) => {
    if (deletingId) return;
    setPendingDelete(message);
  };

  const confirmDeleteMessage = async () => {
    const message = pendingDelete;
    if (!message || deletingId) return;
    setPendingDelete(null);
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
        {conversationsError ? (
          <div className="p-4">
            <ErrorMessage message="Konuşmalar yüklenemedi." />
          </div>
        ) : (
          <ConversationList
            conversations={conversations ?? []}
            selectedId={conversationId}
            currentUserId={user?.id ?? ""}
            onSelect={handleSelectConversation}
            isLoading={conversationsLoading}
          />
        )}
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
          <div className="flex shrink-0 items-center gap-3">
            {conversation?.is_blocked && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                Bu konuşma engellendi
              </span>
            )}
            {!conversation?.is_blocked && showBookingButton && (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => setIsBookingOpen(true)}
              >
                Ders rezervasyonu yap
              </button>
            )}
            {isTutor && conversation && !conversation.is_blocked && (
              <button
                type="button"
                className="text-sm font-medium text-destructive hover:underline"
                onClick={() => setIsBlockConfirmOpen(true)}
              >
                Öğrenciyi engelle
              </button>
            )}
          </div>
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
                    isNew={
                      sentIdsRef.current.has(item.message.id) ||
                      arrivingIdsRef.current.has(item.message.id)
                    }
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
            disabled={!!messagesError || !!conversation?.is_blocked}
            replyTo={replyTo}
            replyToName={
              replyTo
                ? replyTo.sender === user?.id
                  ? "Kendine"
                  : headerTitle
                : undefined
            }
            onCancelReply={() => setReplyTo(null)}
            onTypingChange={setIsComposing}
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

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mesaj silinsin mi?</DialogTitle>
            <DialogDescription>
              Bu mesaj herkes için silinir ve geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMessage}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBlockConfirmOpen}
        onOpenChange={(open) => {
          if (!open) setIsBlockConfirmOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Öğrenciyi engelle</DialogTitle>
            <DialogDescription>
              {headerTitle} bir daha sana mesaj gönderemeyecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBlockConfirmOpen(false)}
              disabled={blockMutation.isPending}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={blockMutation.isPending}
              onClick={() => blockMutation.mutate()}
            >
              Engelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

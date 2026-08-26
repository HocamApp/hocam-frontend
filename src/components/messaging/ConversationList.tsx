"use client";

import Link from "next/link";
import { Conversation } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { cn } from "@/lib/utils";
import { formatConversationActivity } from "./conversationPresentation";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
  isLoading: boolean;
}

function ConversationRow({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const displayName =
    conversation.other_participant?.display_name ||
    `Konuşma #${conversation.id.slice(-6).toUpperCase()}`;
  const activityTime = formatConversationActivity(
    conversation.latest_message?.created_at ?? conversation.created_at,
  );
  const preview = conversation.latest_message?.preview ?? "Henüz mesaj yok";
  const unreadCount = conversation.unread_count ?? 0;
  const profileHref = conversation.tutor_profile
    ? `/tutors/${conversation.tutor_profile.id}`
    : null;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3.5 transition-colors hover:bg-muted/60",
        isSelected ? "bg-muted" : "bg-transparent"
      )}
    >
      {/* Row-sized click/tap target. Sits behind the avatar link (which
          gets its own relative z-10) so both stay independently reachable
          without nesting interactive elements. Ringed with ring-inset so
          the focus ring shows against the row's own bounds instead of
          being clipped by neighboring rows. */}
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-label={`${displayName} ile sohbeti aç`}
        className="absolute inset-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
      <div className="relative shrink-0">
        {profileHref ? (
          <Link
            href={profileHref}
            className="relative z-10 block rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title={`${displayName} profilini aç`}
          >
            <ParticipantAvatar
              name={displayName}
              avatarUrl={conversation.other_participant?.avatar_url}
              shape="circle"
            />
          </Link>
        ) : (
          <ParticipantAvatar
            name={displayName}
            avatarUrl={conversation.other_participant?.avatar_url}
          />
        )}
      </div>
      <div className="pointer-events-none min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{preview}</p>
      </div>
      <div className="pointer-events-none flex shrink-0 flex-col items-end gap-1.5 self-stretch pt-0.5">
        <span className="text-[11px] text-muted-foreground">{activityTime}</span>
        {unreadCount > 0 && (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background"
            aria-label={`${unreadCount} okunmamış`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId: _currentUserId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-medium">Henüz mesajınız yok</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bir hocaya mesaj göndererek başlayabilirsiniz
        </p>
        <Button className="mt-4" asChild>
          <Link href="/tutors">Hoca Bul</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => (
        <ConversationRow
          key={conv.id}
          conversation={conv}
          isSelected={conv.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

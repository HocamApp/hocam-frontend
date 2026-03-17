"use client";

import Link from "next/link";
import { Conversation } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  const suffix = conversation.id.slice(-6).toUpperCase();
  const created = conversation.created_at
    ? formatDate(conversation.created_at)
    : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 border-b p-4 text-left transition-colors hover:bg-slate-50",
        isSelected ? "bg-slate-100" : "bg-white"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-600">
        ?
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          Konuşma #{suffix}
        </p>
        <p className="text-xs text-muted-foreground">{created}</p>
      </div>
    </button>
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
          Bir hocaya ders talebi göndererek başlayabilirsiniz
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

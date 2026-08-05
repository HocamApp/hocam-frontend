"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchConversations } from "@/lib/messagingApi";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation } from "@/types";

const PREVIEW_COUNT = 3;

/**
 * Preply-style re-engagement slot: the most recent conversations with unread
 * badges. Uses the existing /conversations/ list endpoint — no new API work.
 */
export function StudentMessagesPreview() {
  const { isAuthenticated } = useAuth();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: isAuthenticated,
  });

  const preview = (conversations ?? []).slice(0, PREVIEW_COUNT);

  return (
    <section
      aria-labelledby="messages-preview-title"
      className="rounded-2xl border bg-card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Hocalarınla iletişim
          </p>
          <h2 id="messages-preview-title" className="mt-1 text-lg font-semibold tracking-tight">
            Mesajların
          </h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : preview.length === 0 ? (
          <div className="rounded-xl border border-dashed p-5 text-center">
            <p className="font-medium">Henüz mesajlaşman yok</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bir hoca bulup mesaj gönderdiğinde sohbetlerin burada görünecek.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {preview.map((conversation: Conversation) => {
              const name =
                conversation.other_participant?.display_name ?? "Sohbet";
              const unread = conversation.unread_count ?? 0;
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/messages/${conversation.id}`}
                    className="flex items-center gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <ParticipantAvatar
                      name={name}
                      avatarUrl={conversation.other_participant?.avatar_url}
                      className="h-9 w-9 shrink-0"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {name}
                    </span>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        href="/messages"
        className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        Tüm mesajlar
        <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

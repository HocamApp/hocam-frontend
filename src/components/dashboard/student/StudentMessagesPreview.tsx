"use client";

import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchConversations } from "@/lib/messagingApi";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation } from "@/types";

const PREVIEW_COUNT = 2;

function formatConversationTime(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return isToday
    ? date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function StudentMessagesPreview() {
  const { isAuthenticated } = useAuth();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  });

  const preview = (conversations ?? []).slice(0, PREVIEW_COUNT);

  if (!isLoading && preview.length === 0) return null;

  return (
    <section aria-labelledby="messages-preview-title" className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e9004f]">
            İletişim
          </p>
          <h2 id="messages-preview-title" className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950">
            Mesajların
          </h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff0f5] text-[#e9004f]">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((item) => (
              <Skeleton key={item} className="h-[68px] w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {preview.map((conversation: Conversation) => {
              const name = conversation.other_participant?.display_name ?? "Sohbet";
              const unread = conversation.unread_count ?? 0;
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/messages/${conversation.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2.5 transition-colors hover:border-slate-200 hover:bg-[#fbfaf8]"
                  >
                    <ParticipantAvatar
                      name={name}
                      avatarUrl={conversation.other_participant?.avatar_url}
                      shape="circle"
                      className="h-11 w-11 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={unread > 0 ? "truncate text-sm font-bold text-slate-950" : "truncate text-sm font-semibold text-slate-800"}>
                          {name}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatConversationTime(conversation.created_at)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-slate-500">
                          {unread > 0 ? `${unread} yeni mesaj seni bekliyor` : "Konuşmaya devam et"}
                        </span>
                        {unread > 0 && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#e9004f]" aria-label="Okunmamış mesaj" />
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link href="/messages" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-[#e9004f]">
        Tüm mesajlar
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

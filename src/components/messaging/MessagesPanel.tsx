"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, X } from "lucide-react";
import type { Icon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";

import type { Conversation } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { usePageVisibility } from "@/hooks/usePageVisibility";
import { fetchConversations } from "@/lib/messagingApi";
import { NotificationMark } from "@/components/shared/NotificationMark";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConversationList } from "./ConversationList";
import { ConversationWorkspace } from "./ConversationWorkspace";
import {
  filterConversations,
  type ConversationInboxTab,
} from "./conversationPresentation";

const CONVERSATIONS_REFETCH_INTERVAL_MS = 60_000;
const PANEL_ID = "desktop-messages-panel";

export function getMessagesFullscreenHref(
  conversationId: string | null,
): string {
  return conversationId ? `/messages/${conversationId}` : "/messages";
}

type ConversationRenderer = (
  conversationId: string,
  controls: {
    onBack: () => void;
    onClose: () => void;
    onExpand: () => void;
  },
) => ReactNode;

export interface MessagesPanelContentProps {
  conversations: Conversation[];
  currentUserId: string;
  isLoading: boolean;
  error: unknown;
  onClose: () => void;
  onExpand: (href: string) => void;
  renderConversation?: ConversationRenderer;
}

export function MessagesPanelContent({
  conversations,
  currentUserId,
  isLoading,
  error,
  onClose,
  onExpand,
  renderConversation,
}: MessagesPanelContentProps) {
  const [activeTab, setActiveTab] = useState<ConversationInboxTab>("all");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + (conversation.unread_count ?? 0),
        0,
      ),
    [conversations],
  );
  const visibleConversations = useMemo(
    () => filterConversations(conversations, activeTab),
    [activeTab, conversations],
  );

  if (selectedConversationId) {
    const controls = {
      onBack: () => setSelectedConversationId(null),
      onClose,
      onExpand: () =>
        onExpand(getMessagesFullscreenHref(selectedConversationId)),
    };
    return (
      <div className="h-full min-h-0">
        {renderConversation ? (
          renderConversation(selectedConversationId, controls)
        ) : (
          <ConversationWorkspace
            conversationId={selectedConversationId}
            layout="panel"
            {...controls}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <h2 className="text-xl font-bold tracking-[-0.02em]">Mesajlar</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="ys-icon-btn"
            onClick={() => onExpand(getMessagesFullscreenHref(null))}
            aria-label="Tam ekranda aç"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ys-icon-btn"
            onClick={onClose}
            aria-label="Mesajları kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className="flex h-14 shrink-0 items-end gap-7 border-b border-line px-5"
        role="tablist"
        aria-label="Mesaj filtreleri"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className="relative h-full px-1 pt-1 text-sm font-semibold text-ink"
          onClick={() => setActiveTab("all")}
        >
          Tümü
          {activeTab === "all" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-pink" />
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "unread"}
          aria-label={
            unreadTotal > 0 ? `Okunmamış ${unreadTotal}` : "Okunmamış"
          }
          className="relative flex h-full items-center gap-2 px-1 pt-1 text-sm font-semibold text-ink"
          onClick={() => setActiveTab("unread")}
        >
          Okunmamış
          {unreadTotal > 0 && (
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-paper px-1.5 text-[11px] font-semibold"
              aria-hidden="true"
            >
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
          {activeTab === "unread" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-pink" />
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {error ? (
          <div className="p-5">
            <ErrorMessage message="Mesajlar yüklenemedi. Lütfen tekrar deneyin." />
          </div>
        ) : activeTab === "unread" && !isLoading && !visibleConversations.length ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center px-8 text-center">
            <p className="text-sm font-semibold">Okunmamış mesajınız yok.</p>
            <p className="mt-1 text-xs text-ink-mid">
              Yeni mesajlar geldiğinde burada görünecek.
            </p>
          </div>
        ) : (
          <ConversationList
            conversations={visibleConversations}
            selectedId={null}
            currentUserId={currentUserId}
            onSelect={setSelectedConversationId}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export function MessagesPanel({
  icon: MessageIcon,
  isActive,
}: {
  icon: Icon;
  isActive: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isPageVisible = usePageVisibility();
  const [open, setOpen] = useState(false);
  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: isPageVisible
      ? CONVERSATIONS_REFETCH_INTERVAL_MS
      : false,
    enabled: isAuthenticated,
  });
  const unreadTotal = (conversations ?? []).reduce(
    (total, conversation) => total + (conversation.unread_count ?? 0),
    0,
  );

  const openFullscreen = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span className="relative inline-flex">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="ys-icon-btn"
            aria-label={
              unreadTotal > 0
                ? `Mesajlar, ${unreadTotal} okunmamış`
                : "Mesajlar"
            }
            aria-expanded={open}
            aria-controls={PANEL_ID}
          >
            <MessageIcon
              className="h-5 w-5"
              weight={isActive ? "fill" : "regular"}
            />
          </button>
        </PopoverTrigger>
        <NotificationMark
          unreadCount={unreadTotal}
          className="absolute -right-1 -top-1"
        />
      </span>
      <PopoverContent
        id={PANEL_ID}
        align="end"
        sideOffset={10}
        className="h-[min(48rem,calc(100dvh-var(--app-header-h)-1.5rem))] w-[min(31rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-line bg-surface p-0 text-ink shadow-float"
      >
        <MessagesPanelContent
          conversations={conversations ?? []}
          currentUserId={user?.id ?? ""}
          isLoading={isLoading}
          error={error}
          onClose={() => setOpen(false)}
          onExpand={openFullscreen}
        />
      </PopoverContent>
    </Popover>
  );
}

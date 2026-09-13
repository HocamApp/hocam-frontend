import type { Conversation } from "@/types";

import { istanbulDayKey } from "@/lib/bookingTime";

export type ConversationInboxTab = "all" | "unread";

export function filterConversations(
  conversations: Conversation[],
  tab: ConversationInboxTab,
): Conversation[] {
  if (tab === "all") return conversations;
  return conversations.filter((conversation) => (conversation.unread_count ?? 0) > 0);
}

function startOfIstanbulDay(value: Date): number {
  return Date.parse(`${istanbulDayKey(value)}T00:00:00Z`);
}

export function formatConversationActivity(
  iso: string | null | undefined,
  now = new Date(),
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const dayDifference = Math.round(
    (startOfIstanbulDay(now) - startOfIstanbulDay(date)) / 86_400_000,
  );
  if (dayDifference === 0) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    });
  }
  if (dayDifference > 0 && dayDifference < 7) {
    return date.toLocaleDateString("tr-TR", {
      weekday: "short",
      timeZone: "Europe/Istanbul",
    });
  }
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Istanbul",
  });
}

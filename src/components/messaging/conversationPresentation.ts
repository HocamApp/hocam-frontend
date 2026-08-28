import type { Conversation } from "@/types";

export type ConversationInboxTab = "all" | "unread";

export function filterConversations(
  conversations: Conversation[],
  tab: ConversationInboxTab,
): Conversation[] {
  if (tab === "all") return conversations;
  return conversations.filter((conversation) => (conversation.unread_count ?? 0) > 0);
}

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

export function formatConversationActivity(
  iso: string | null | undefined,
  now = new Date(),
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const dayDifference = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000,
  );
  if (dayDifference === 0) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (dayDifference > 0 && dayDifference < 7) {
    return date.toLocaleDateString("tr-TR", { weekday: "short" });
  }
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCoachingSchedulingState } from "@/lib/coachingApi";
import { fetchCoachingPurchaseConversation } from "@/lib/messagingApi";

/**
 * Where "Hocana yaz" goes: the coaching thread itself. Null while it loads,
 * once the coaching is over (the server names no coaching then), or when the
 * thread cannot be read: a link that opens nothing is worse than no link.
 */
export function useCoachingMessagesHref(): string | null {
  const stateQuery = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });
  const purchaseId = stateQuery.data?.id;
  const conversationQuery = useQuery({
    queryKey: ["coaching-purchase-conversation", purchaseId],
    queryFn: () => fetchCoachingPurchaseConversation(purchaseId!),
    enabled: Boolean(purchaseId),
    staleTime: 10 * 60_000,
  });
  const id = conversationQuery.data?.id;
  return id ? `/messages/${id}` : null;
}

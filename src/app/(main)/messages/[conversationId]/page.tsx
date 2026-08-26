"use client";

import { ConversationWorkspace } from "@/components/messaging/ConversationWorkspace";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  return (
    <RouteGuard requireAuth>
      <ConversationWorkspace
        conversationId={params.conversationId}
        layout="page"
      />
    </RouteGuard>
  );
}

"use client";

import { use } from "react";
import { ConversationWorkspace } from "@/components/messaging/ConversationWorkspace";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return (
    <RouteGuard requireAuth>
      <ConversationWorkspace
        conversationId={conversationId}
        layout="page"
      />
    </RouteGuard>
  );
}

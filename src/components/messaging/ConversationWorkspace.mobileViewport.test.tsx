import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

class TestVisualViewport extends EventTarget {
  height = 568;
  width = 320;
  offsetTop = 0;
  offsetLeft = 0;
  pageTop = 0;
  pageLeft = 0;
  scale = 1;
  onresize = null;
  onscroll = null;
}

const visualViewport = new TestVisualViewport();
let messageResults: Array<Record<string, unknown>> = [];
let scrollIntoViewCalls = 0;

mock.module("next/navigation", {
  namedExports: {
    useRouter: () => ({ push: () => {} }),
  },
});
mock.module("next/link", {
  defaultExport: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
});
mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({
      isAuthenticated: true,
      isTutor: false,
      user: { id: "student-1" },
    }),
  },
});
mock.module("@/hooks/usePageVisibility", {
  namedExports: { usePageVisibility: () => true },
});
mock.module("@/lib/messagingApi", {
  namedExports: {
    fetchMessages: async () => messageResults,
    fetchConversation: async () => ({
      id: "conversation-1",
      is_blocked: false,
      other_participant: { display_name: "Ayşe Hoca", avatar_url: "" },
    }),
    fetchConversations: async () => [],
    fetchTypingStatus: async () => ({ is_typing: false }),
    updateTypingStatus: async () => {},
    deleteMessage: async () => ({}),
    blockConversationParticipant: async () => {},
  },
});
mock.module("@/components/messaging/MessageInput", {
  namedExports: { MessageInput: () => <div>Mesaj yaz</div> },
});
mock.module("@/components/messaging/MessageBubble", {
  namedExports: {
    MessageBubble: ({ message }: { message: { message_text?: string } }) => (
      <div>{message.message_text}</div>
    ),
  },
});
mock.module("@/components/messaging/ParticipantAvatar", {
  namedExports: { ParticipantAvatar: () => <span aria-hidden="true" /> },
});
mock.module("@/components/messaging/ConversationList", {
  namedExports: { ConversationList: () => null },
});
mock.module("@/components/lessons/BookingModal", {
  namedExports: { BookingModal: () => null },
});

let ConversationWorkspace: React.ComponentType<{
  conversationId: string;
  layout: "page" | "panel";
}>;

before(async () => {
  ConversationWorkspace = (
    await import("./ConversationWorkspace")
  ).ConversationWorkspace;
});

beforeEach(() => {
  messageResults = [];
  scrollIntoViewCalls = 0;
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {
      scrollIntoViewCalls += 1;
    },
  });
  visualViewport.height = 568;
  visualViewport.offsetTop = 0;
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 568,
  });
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: visualViewport,
  });
});

afterEach(() => cleanup());

test("mobile conversation follows the visible viewport when the iOS keyboard opens", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { container } = render(
    <QueryClientProvider client={queryClient}>
      <ConversationWorkspace conversationId="conversation-1" layout="page" />
    </QueryClientProvider>,
  );

  const workspace = container.firstElementChild as HTMLElement;
  assert.equal(
    workspace.style.getPropertyValue("--conversation-viewport-height"),
    "568px",
  );
  assert.equal(workspace.dataset.keyboard, "closed");

  act(() => {
    visualViewport.height = 320;
    visualViewport.dispatchEvent(new Event("resize"));
  });
  await act(async () => { await new Promise((resolve) => requestAnimationFrame(resolve)); });

  assert.equal(
    workspace.style.getPropertyValue("--conversation-viewport-height"),
    "320px",
  );
  assert.equal(workspace.dataset.keyboard, "open");

  act(() => {
    visualViewport.offsetTop = 120;
    visualViewport.dispatchEvent(new Event("scroll"));
  });
  await act(async () => { await new Promise((resolve) => requestAnimationFrame(resolve)); });
  assert.equal(
    workspace.style.getPropertyValue("--conversation-viewport-top"),
    "120px",
    "Safari's offset-only pan must update positioning without a resize",
  );

  act(() => {
    visualViewport.height = 568;
    visualViewport.offsetTop = 120;
    visualViewport.dispatchEvent(new Event("resize"));
  });
  await act(async () => { await new Promise((resolve) => requestAnimationFrame(resolve)); });
  assert.equal(workspace.dataset.keyboard, "closed");
  assert.equal(workspace.style.getPropertyValue("--conversation-viewport-top"), "0px");
});

test("aligning the latest message never scrolls the outer document", async () => {
  messageResults = [
    {
      id: "message-1",
      sender: "student-1",
      message_text: "Son mesaj",
      created_at: "2026-09-02T10:00:00Z",
      is_deleted: false,
    },
  ];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ConversationWorkspace conversationId="conversation-1" layout="page" />
    </QueryClientProvider>,
  );

  await screen.findByText("Son mesaj");
  assert.equal(scrollIntoViewCalls, 0);
});

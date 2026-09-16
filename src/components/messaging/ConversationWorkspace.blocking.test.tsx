import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, mock, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// One mock set, swapped per test: node caches modules after the first import.
const state = {
  isTutor: true,
  conversation: {
    id: "conversation-1",
    is_blocked: false,
    can_block: true,
    other_participant: { display_name: "Deniz Öğrenci", avatar_url: "" },
  } as Record<string, unknown>,
  unblockCalls: 0,
  blockCalls: 0,
};

mock.module("next/navigation", { namedExports: { useRouter: () => ({ push: () => {} }) } });
mock.module("next/link", {
  defaultExport: ({ children, ...props }: React.ComponentProps<"a">) => <a {...props}>{children}</a>,
});
mock.module("@/hooks/useAuth", {
  namedExports: {
    useAuth: () => ({ isAuthenticated: true, isTutor: state.isTutor, user: { id: "tutor-1" } }),
  },
});
mock.module("@/hooks/usePageVisibility", { namedExports: { usePageVisibility: () => true } });
mock.module("@/lib/messagingApi", {
  namedExports: {
    fetchMessages: async () => [],
    fetchConversation: async () => state.conversation,
    fetchConversations: async () => [],
    fetchTypingStatus: async () => ({ is_typing: false }),
    updateTypingStatus: async () => {},
    deleteMessage: async () => ({}),
    blockConversationParticipant: async () => {
      state.blockCalls += 1;
      return state.conversation;
    },
    unblockConversationParticipant: async () => {
      state.unblockCalls += 1;
      return state.conversation;
    },
  },
});
mock.module("@/components/messaging/MessageInput", {
  namedExports: { MessageInput: () => <div>Mesaj kutusu</div> },
});
mock.module("@/components/messaging/MessageBubble", {
  namedExports: { MessageBubble: () => null },
});
mock.module("@/components/messaging/ParticipantAvatar", {
  namedExports: { ParticipantAvatar: () => <span aria-hidden="true" /> },
});
mock.module("@/components/messaging/ConversationList", {
  namedExports: { ConversationList: () => null },
});
mock.module("@/components/lessons/BookingModal", { namedExports: { BookingModal: () => null } });

let ConversationWorkspace: React.ComponentType<{
  conversationId: string;
  layout: "page" | "panel";
}>;

before(async () => {
  ConversationWorkspace = (await import("./ConversationWorkspace")).ConversationWorkspace;
});

beforeEach(() => {
  state.isTutor = true;
  state.unblockCalls = 0;
  state.blockCalls = 0;
  state.conversation = {
    id: "conversation-1",
    is_blocked: false,
    can_block: true,
    other_participant: { display_name: "Deniz Öğrenci", avatar_url: "" },
  };
});

afterEach(() => cleanup());

async function renderWorkspace() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ConversationWorkspace conversationId="conversation-1" layout="page" />
      </QueryClientProvider>
    );
  });
  await act(async () => {
    await Promise.resolve();
  });
}

test("a blocked thread explains itself and offers the way out instead of a disabled box", async () => {
  state.conversation = { ...state.conversation, is_blocked: true };
  await renderWorkspace();

  await screen.findByText(/Bu öğrenciyi engelledin/);
  assert.equal(screen.queryByText("Mesaj kutusu"), null, "no composer in a blocked thread");
  // The old red "Bu konuşma engellendi" pill is gone.
  assert.equal(screen.queryByText("Bu konuşma engellendi"), null);

  const buttons = await screen.findAllByRole("button", { name: "Engeli kaldır" });
  await act(async () => {
    buttons[0].click();
  });
  assert.equal(state.unblockCalls, 1);
});

test("an unblocked thread keeps the composer and offers blocking", async () => {
  await renderWorkspace();

  await screen.findByRole("button", { name: "Öğrenciyi engelle" });
  assert.ok(screen.getByText("Mesaj kutusu"));
  assert.equal(screen.queryByRole("button", { name: "Engeli kaldır" }), null);
});

test("the student sees why the thread is closed but cannot unblock", async () => {
  state.isTutor = false;
  state.conversation = { ...state.conversation, is_blocked: true };
  await renderWorkspace();

  await screen.findByText("Bu konuşmaya mesaj gönderilemiyor.");
  assert.equal(screen.queryByRole("button", { name: "Engeli kaldır" }), null);
});

test("threads that cannot be blocked do not offer the button at all", async () => {
  // Lesson-request and coaching threads carry no MessageRequest; the button
  // used to show anyway and answer a 400 with a generic error toast.
  state.conversation = { ...state.conversation, can_block: false };
  await renderWorkspace();

  // Wait for the thread itself to render before asserting an absence.
  await screen.findByText("Mesaj kutusu");
  assert.equal(screen.queryByRole("button", { name: "Öğrenciyi engelle" }), null);
});

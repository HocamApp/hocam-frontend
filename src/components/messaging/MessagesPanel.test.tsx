import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { Conversation } from "@/types";

import {
  MessagesPanelContent,
  getMessagesFullscreenHref,
} from "./MessagesPanel";

const conversations: Conversation[] = [
  {
    id: "read-conversation",
    lesson_request: "lesson-1",
    student: "student",
    tutor: "tutor-1",
    created_at: "2026-08-25T10:00:00+03:00",
    other_participant: {
      id: "tutor-1",
      email: "ada@example.com",
      display_name: "Ada Yılmaz",
    },
    unread_count: 0,
    latest_message: {
      preview: "Yarın görüşürüz.",
      created_at: "2026-08-25T10:00:00+03:00",
      sender_id: "tutor-1",
      kind: "text",
    },
    is_blocked: false,
  },
  {
    id: "unread-conversation",
    lesson_request: "lesson-2",
    student: "student",
    tutor: "tutor-2",
    created_at: "2026-08-26T10:00:00+03:00",
    other_participant: {
      id: "tutor-2",
      email: "can@example.com",
      display_name: "Can Demir",
    },
    unread_count: 2,
    latest_message: {
      preview: "Ders saatini netleştirelim.",
      created_at: "2026-08-26T10:00:00+03:00",
      sender_id: "tutor-2",
      kind: "text",
    },
    is_blocked: false,
  },
];

afterEach(() => cleanup());

describe("desktop messages panel", () => {
  test("shows only all and unread tabs and filters from existing unread counts", () => {
    render(
      <MessagesPanelContent
        conversations={conversations}
        currentUserId="student"
        isLoading={false}
        error={null}
        onClose={() => {}}
        onExpand={() => {}}
      />,
    );

    assert.ok(screen.getByRole("tab", { name: "Tümü" }));
    assert.ok(screen.getByRole("tab", { name: "Okunmamış 2" }));
    assert.equal(screen.queryByText("Arşiv"), null);
    assert.ok(screen.getByText("Ada Yılmaz"));
    assert.ok(screen.getByText("Can Demir"));

    fireEvent.click(screen.getByRole("tab", { name: "Okunmamış 2" }));

    assert.equal(screen.queryByText("Ada Yılmaz"), null);
    assert.ok(screen.getByText("Can Demir"));
  });

  test("selects a conversation in place and can return to the list", () => {
    render(
      <MessagesPanelContent
        conversations={conversations}
        currentUserId="student"
        isLoading={false}
        error={null}
        onClose={() => {}}
        onExpand={() => {}}
        renderConversation={(conversationId, controls) => (
          <div>
            <p>Panel sohbeti: {conversationId}</p>
            <button type="button" onClick={controls.onBack}>
              Konuşma listesine dön
            </button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Can Demir ile sohbeti aç" }));
    assert.ok(screen.getByText("Panel sohbeti: unread-conversation"));

    fireEvent.click(screen.getByRole("button", { name: "Konuşma listesine dön" }));
    assert.ok(screen.getByRole("tab", { name: "Tümü" }));
  });

  test("derives the existing full-screen routes without inventing a panel URL", () => {
    assert.equal(getMessagesFullscreenHref(null), "/messages");
    assert.equal(
      getMessagesFullscreenHref("conversation-id"),
      "/messages/conversation-id",
    );
  });
});

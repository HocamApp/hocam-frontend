import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Conversation } from "@/types";

import {
  filterConversations,
  formatConversationActivity,
} from "./conversationPresentation";

function conversation(id: string, unreadCount: number): Conversation {
  return {
    id,
    lesson_request: "lesson",
    student: "student",
    tutor: "tutor",
    created_at: "2026-08-20T09:00:00+03:00",
    unread_count: unreadCount,
    is_blocked: false,
  };
}

describe("conversation inbox presentation", () => {
  test("unread filtering uses the existing unread_count only", () => {
    const readConversation = conversation("read", 0);
    const unreadConversation = conversation("unread", 2);

    assert.deepEqual(
      filterConversations(
        [readConversation, unreadConversation],
        "unread",
      ).map((item) => item.id),
      ["unread"],
    );
    assert.deepEqual(
      filterConversations([readConversation, unreadConversation], "all").map(
        (item) => item.id,
      ),
      ["read", "unread"],
    );
  });

  test("activity formatting distinguishes today, the last week, and older dates", () => {
    const now = new Date("2026-08-26T15:00:00+03:00");

    assert.equal(
      formatConversationActivity("2026-08-26T10:20:00+03:00", now),
      "10:20",
    );
    assert.equal(
      formatConversationActivity("2026-08-25T10:20:00+03:00", now),
      "Sal",
    );
    assert.equal(
      formatConversationActivity("2026-08-10T10:20:00+03:00", now),
      "10 Ağu",
    );
  });

  test("activity formatting returns an empty label for invalid or missing input", () => {
    const now = new Date("2026-08-26T15:00:00+03:00");

    assert.equal(formatConversationActivity(undefined, now), "");
    assert.equal(formatConversationActivity("not-a-date", now), "");
  });
});

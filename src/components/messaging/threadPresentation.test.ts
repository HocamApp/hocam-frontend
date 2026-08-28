import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Message } from "@/types";

import { buildThreadItems, formatDaySeparator } from "./threadPresentation";

function message(id: string, sender: string, createdAt: string): Message {
  return {
    id,
    conversation: "conversation",
    sender,
    message_text: id,
    created_at: createdAt,
    read_at: null,
    is_deleted: false,
    attachment: null,
  };
}

describe("message thread presentation", () => {
  test("groups consecutive same-sender messages and shows time on the final group item", () => {
    const items = buildThreadItems([
      message("one", "student", "2026-08-26T10:00:00+03:00"),
      message("two", "student", "2026-08-26T10:01:00+03:00"),
      message("three", "tutor", "2026-08-26T10:02:00+03:00"),
    ]).filter((item) => item.kind === "message");

    assert.deepEqual(
      items.map((item) => [item.groupedWithPrev, item.showTime]),
      [
        [false, false],
        [true, true],
        [false, true],
      ],
    );
  });

  test("adds one separator per calendar day", () => {
    const items = buildThreadItems([
      message("one", "student", "2026-08-25T23:59:00+03:00"),
      message("two", "student", "2026-08-26T00:01:00+03:00"),
    ]);

    assert.equal(items.filter((item) => item.kind === "separator").length, 2);
  });

  test("uses the approved Turkish today and yesterday labels", () => {
    const now = new Date("2026-08-26T15:00:00+03:00");

    assert.equal(formatDaySeparator("2026-08-26T10:00:00+03:00", now), "Bugün");
    assert.equal(formatDaySeparator("2026-08-25T10:00:00+03:00", now), "Dün");
  });
});

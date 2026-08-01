import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Notification } from "@/types/api";
import {
  EARLY_SUPPORTER_WELCOME_TYPE,
  findUnreadEarlySupporterWelcome,
} from "./earlySupporterWelcome";

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: "notification-1",
    type: "booking_confirmed",
    title: "Bildirim",
    body: "",
    is_read: false,
    related_object_type: "",
    related_object_id: null,
    created_at: "2026-07-26T12:00:00Z",
    ...overrides,
  };
}

describe("findUnreadEarlySupporterWelcome", () => {
  it("returns the unread early-supporter notification", () => {
    const welcome = notification({
      id: "welcome",
      type: EARLY_SUPPORTER_WELCOME_TYPE,
      title: "Hocam'a hoş geldin!",
    });

    assert.equal(
      findUnreadEarlySupporterWelcome([
        notification({ id: "booking" }),
        welcome,
      ]),
      welcome
    );
  });

  it("does not reopen an acknowledged welcome", () => {
    assert.equal(
      findUnreadEarlySupporterWelcome([
        notification({
          type: EARLY_SUPPORTER_WELCOME_TYPE,
          is_read: true,
        }),
      ]),
      undefined
    );
  });

  it("does not treat ordinary notifications as a welcome", () => {
    assert.equal(
      findUnreadEarlySupporterWelcome([
        notification({ type: "message" }),
        notification({ type: "booking_confirmed" }),
      ]),
      undefined
    );
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { MessageBubble } from "./MessageBubble";

after(() => window.close());
afterEach(cleanup);

describe("Phase 7 voice attachment presentation", () => {
  it("uses an authorized-load action instead of persisting a storage URL", () => {
    render(
      <MessageBubble
        isOwnMessage={false}
        message={{
          id: "message-1",
          conversation: "conversation-1",
          sender: "tutor-1",
          message_text: "",
          created_at: "2026-08-09T10:00:00Z",
          read_at: null,
          is_deleted: false,
          attachment: {
            id: "attachment-1",
            kind: "voice",
            original_name: "yanit.webm",
            mime_type: "audio/webm",
            size_bytes: 1024,
            storage_state: "active",
            download_url: "/api/messages/attachments/attachment-1/download/",
          },
        }}
      />
    );

    assert.ok(screen.getByRole("button", { name: "Sesli mesajı oynat" }));
    assert.equal(screen.queryByRole("audio"), null);
    assert.equal(screen.queryByText(/storage_path/i), null);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingResponseSla, MessageAttachment } from "@/types";

describe("Faz 7 messaging API contract types", () => {
  it("keeps server-authoritative SLA timing nullable while calendar coverage is pending", () => {
    const cycle: CoachingResponseSla = {
      id: "cycle-1", status: "calendar_pending", first_unanswered_at: "2026-08-09T10:00:00Z",
      due_at: null, breached_at: null, satisfied_at: null,
    };
    assert.equal(cycle.due_at, null);
    assert.equal(cycle.status, "calendar_pending");
  });

  it("exposes attachment metadata/download route but no storage path or signed URL", () => {
    const attachment: MessageAttachment = {
      id: "attachment-1", kind: "voice", original_name: "yanit.webm", mime_type: "audio/webm",
      size_bytes: 1200, storage_state: "active", download_url: "/api/messages/attachments/attachment-1/download/",
    };
    assert.match(attachment.download_url, /\/download\/$/);
    assert.equal("storage_path" in attachment, false);
  });
});

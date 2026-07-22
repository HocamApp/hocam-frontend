import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  acceptLessonQuestionInvitation,
  dismissLessonQuestionInvitation,
  getLessonQuestionInvitationStorageKey,
  initialLessonQuestionInvitationState,
  readLessonQuestionInvitationDisposition,
  syncLessonQuestionInvitation,
  writeLessonQuestionInvitationDisposition,
} from "./lessonQuestionInvitation";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("lesson question invitation state", () => {
  it("keeps the panel and invitation closed without an active question", () => {
    assert.deepEqual(
      syncLessonQuestionInvitation(initialLessonQuestionInvitationState, {
        activeQuestionId: null,
        version: 0,
        storedDisposition: null,
      }),
      initialLessonQuestionInvitationState
    );
  });

  it("opens an invitation for a new unhandled share version", () => {
    assert.deepEqual(
      syncLessonQuestionInvitation(initialLessonQuestionInvitationState, {
        activeQuestionId: "question-1",
        version: 2,
        storedDisposition: null,
      }),
      { handledVersion: 2, modalOpen: true, panelOpen: false }
    );
  });

  it("accepts the invitation and keeps the same version open without spam", () => {
    const accepted = acceptLessonQuestionInvitation(
      { handledVersion: 2, modalOpen: true, panelOpen: false },
      2
    );
    assert.deepEqual(accepted, {
      handledVersion: 2,
      modalOpen: false,
      panelOpen: true,
    });
    assert.deepEqual(
      syncLessonQuestionInvitation(accepted, {
        activeQuestionId: "question-1",
        version: 2,
        storedDisposition: null,
      }),
      accepted
    );
  });

  it("dismisses without opening the panel and invites again for a new version", () => {
    const dismissed = dismissLessonQuestionInvitation(
      { handledVersion: 2, modalOpen: true, panelOpen: false },
      2
    );
    assert.deepEqual(dismissed, {
      handledVersion: 2,
      modalOpen: false,
      panelOpen: false,
    });
    assert.deepEqual(
      syncLessonQuestionInvitation(dismissed, {
        activeQuestionId: "question-1",
        version: 3,
        storedDisposition: null,
      }),
      { handledVersion: 3, modalOpen: true, panelOpen: false }
    );
  });

  it("restores accepted and dismissed versions from session storage", () => {
    assert.deepEqual(
      syncLessonQuestionInvitation(initialLessonQuestionInvitationState, {
        activeQuestionId: "question-1",
        version: 4,
        storedDisposition: "accepted",
      }),
      { handledVersion: 4, modalOpen: false, panelOpen: true }
    );
    assert.deepEqual(
      syncLessonQuestionInvitation(initialLessonQuestionInvitationState, {
        activeQuestionId: "question-1",
        version: 4,
        storedDisposition: "dismissed",
      }),
      { handledVersion: 4, modalOpen: false, panelOpen: false }
    );
  });

  it("clears an open panel when the backend share is removed", () => {
    assert.deepEqual(
      syncLessonQuestionInvitation(
        { handledVersion: 4, modalOpen: false, panelOpen: true },
        { activeQuestionId: null, version: 5, storedDisposition: null }
      ),
      initialLessonQuestionInvitationState
    );
  });
});

describe("lesson question invitation storage", () => {
  it("scopes the disposition to booking and version", () => {
    assert.equal(
      getLessonQuestionInvitationStorageKey("booking-1", 7),
      "hocam:lesson-question:booking-1:7"
    );
  });

  it("writes and reads only accepted disposition values", () => {
    const storage = createStorage();
    writeLessonQuestionInvitationDisposition(
      storage,
      "booking-1",
      7,
      "accepted"
    );
    assert.equal(
      readLessonQuestionInvitationDisposition(storage, "booking-1", 7),
      "accepted"
    );
    storage.setItem(
      getLessonQuestionInvitationStorageKey("booking-1", 8),
      "unexpected"
    );
    assert.equal(
      readLessonQuestionInvitationDisposition(storage, "booking-1", 8),
      null
    );
  });
});

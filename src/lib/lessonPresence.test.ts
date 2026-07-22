import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createPresenceTracker,
  handleJoin,
  handleLeave,
  joinMessage,
  leaveMessage,
  parseParticipantJoined,
  parseParticipantLeft,
  setLocalParticipant,
} from "./lessonPresence";

describe("participant event parsing", () => {
  it("reads participantJoined id + displayName", () => {
    assert.deepEqual(parseParticipantJoined({ id: "p1", displayName: "Ada" }), {
      id: "p1",
      displayName: "Ada",
    });
  });

  it("tolerates a missing displayName", () => {
    assert.deepEqual(parseParticipantJoined({ id: "p1" }), {
      id: "p1",
      displayName: undefined,
    });
  });

  it("rejects malformed join payloads", () => {
    assert.equal(parseParticipantJoined({}), null);
    assert.equal(parseParticipantJoined({ id: 5 }), null);
    assert.equal(parseParticipantJoined(null), null);
  });

  it("reads participantLeft id", () => {
    assert.deepEqual(parseParticipantLeft({ id: "p1" }), { id: "p1" });
    assert.equal(parseParticipantLeft({}), null);
  });
});

describe("Turkish messages with privacy fallback", () => {
  it("uses the name when present", () => {
    assert.equal(joinMessage("Ada"), "Ada derse katıldı.");
    assert.equal(leaveMessage("Ada"), "Ada dersten ayrıldı.");
  });

  it("falls back safely when the name is missing or blank", () => {
    assert.equal(joinMessage(undefined), "Bir katılımcı derse katıldı.");
    assert.equal(joinMessage("   "), "Bir katılımcı derse katıldı.");
    assert.equal(leaveMessage(null), "Bir katılımcı dersten ayrıldı.");
  });
});

describe("presence tracker", () => {
  it("toasts a remote join once and the matching leave once", () => {
    const t = createPresenceTracker();
    setLocalParticipant(t, "me");
    assert.equal(handleJoin(t, "p1", "Ada"), "Ada derse katıldı.");
    assert.equal(handleLeave(t, "p1"), "Ada dersten ayrıldı.");
  });

  it("never toasts for the local participant", () => {
    const t = createPresenceTracker();
    setLocalParticipant(t, "me");
    assert.equal(handleJoin(t, "me", "Ben"), null);
    assert.equal(handleLeave(t, "me"), null);
  });

  it("suppresses duplicate/reconnect join events for a present peer", () => {
    const t = createPresenceTracker();
    setLocalParticipant(t, "me");
    assert.equal(handleJoin(t, "p1", "Ada"), "Ada derse katıldı.");
    // Reconnect re-fires participantJoined for the still-present peer.
    assert.equal(handleJoin(t, "p1", "Ada"), null);
  });

  it("ignores a leave for a peer that was never seen", () => {
    const t = createPresenceTracker();
    setLocalParticipant(t, "me");
    assert.equal(handleLeave(t, "ghost"), null);
  });

  it("re-toasts a genuine rejoin after a leave", () => {
    const t = createPresenceTracker();
    setLocalParticipant(t, "me");
    handleJoin(t, "p1", "Ada");
    handleLeave(t, "p1");
    assert.equal(handleJoin(t, "p1", "Ada"), "Ada derse katıldı.");
  });

  it("uses the privacy fallback when a join has no name", () => {
    const t = createPresenceTracker();
    setLocalParticipant(t, "me");
    assert.equal(handleJoin(t, "p1"), "Bir katılımcı derse katıldı.");
    assert.equal(handleLeave(t, "p1"), "Bir katılımcı dersten ayrıldı.");
  });
});

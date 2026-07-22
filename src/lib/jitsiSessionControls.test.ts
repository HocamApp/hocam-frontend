import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLessonJitsiConfigOverwrite,
  getLessonJitsiToolbarButtons,
  getScreenShareButtonLabel,
  screenSharingStateFromEvent,
} from "./jitsiSessionControls";

describe("lesson Jitsi screen-sharing controls", () => {
  it("shows desktop sharing only in the tutor toolbar", () => {
    assert.deepEqual(getLessonJitsiToolbarButtons("tutor"), [
      "microphone", "camera", "chat", "whiteboard", "desktop", "hangup",
    ]);
    assert.deepEqual(getLessonJitsiToolbarButtons("student"), [
      "microphone", "camera", "chat", "hangup",
    ]);
  });

  it("hides the conference subject without disabling Jitsi layout behavior", () => {
    const config = getLessonJitsiConfigOverwrite("tutor");

    assert.equal(config.hideConferenceSubject, true);
    assert.equal("disableTileView" in config, false);
    assert.deepEqual(config.toolbarButtons, [
      "microphone", "camera", "chat", "whiteboard", "desktop", "hangup",
    ]);
  });

  it("reads the official Jitsi local sharing event safely", () => {
    assert.equal(screenSharingStateFromEvent({ on: true }), true);
    assert.equal(screenSharingStateFromEvent({ on: false }), false);
    assert.equal(screenSharingStateFromEvent({}), null);
    assert.equal(screenSharingStateFromEvent(null), null);
  });

  it("uses action text that reflects the local sharing state", () => {
    assert.equal(getScreenShareButtonLabel(false), "Ekran paylaş");
    assert.equal(getScreenShareButtonLabel(true), "Paylaşımı durdur");
  });
});

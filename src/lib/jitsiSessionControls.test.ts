import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  audioOnlyFromEvent,
  AUDIO_ONLY_EVENTS,
  audioOnlyCommandName,
  checkJitsiCapabilities,
  filmstripToggleNeeded,
  filmstripVisibleFromEvent,
  getLessonJitsiConfigOverwrite,
  getLessonJitsiToolbarButtons,
  getScreenShareButtonLabel,
  screenSharingStateFromEvent,
  videoHeightFromEvent,
  videoQualityCommands,
  videoQualityLevelFromState,
  VIDEO_QUALITY_LEVELS,
  whiteboardVisibleFromEvent,
} from "./jitsiSessionControls";

describe("lesson Jitsi screen-sharing controls", () => {
  it("shows desktop sharing only in the tutor toolbar", () => {
    assert.deepEqual(getLessonJitsiToolbarButtons("tutor"), [
      "microphone", "camera", "chat", "whiteboard", "desktop",
    ]);
    assert.deepEqual(getLessonJitsiToolbarButtons("student"), [
      "microphone", "camera", "chat",
    ]);
  });

  it("omits the native hangup so leaving must go through the confirm modal", () => {
    assert.equal(getLessonJitsiToolbarButtons("tutor").includes("hangup"), false);
    assert.equal(getLessonJitsiToolbarButtons("student").includes("hangup"), false);
  });

  it("hides the conference subject without disabling Jitsi layout behavior", () => {
    const config = getLessonJitsiConfigOverwrite("tutor");

    assert.equal(config.hideConferenceSubject, true);
    assert.equal("disableTileView" in config, false);
    assert.deepEqual(config.toolbarButtons, [
      "microphone", "camera", "chat", "whiteboard", "desktop",
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

  it("hides Jitsi's own timer and connection indicators for a single clock", () => {
    const config = getLessonJitsiConfigOverwrite("student");
    // Official current key for hiding the conference timer is timeTimer.enabled;
    // the legacy hideConferenceTimer key must not be used.
    assert.deepEqual(config.timeTimer, { enabled: false });
    assert.equal("hideConferenceTimer" in config, false);
    assert.deepEqual(config.connectionIndicators, {
      disabled: true,
      autoHide: true,
      autoHideTimeout: 0,
      inactiveDisabled: true,
      disableDetails: true,
    });
    assert.equal(config.disable1On1Mode, true);
  });
});

describe("video quality levels", () => {
  it("exposes four Turkish levels best-performance → best-quality", () => {
    assert.deepEqual(
      VIDEO_QUALITY_LEVELS.map((o) => o.label),
      [
        "En iyi performans",
        "Düşük görüntü kalitesi",
        "Dengeli",
        "En yüksek görüntü kalitesi",
      ]
    );
  });

  it("only the audio-only level carries the camera warning", () => {
    const withWarning = VIDEO_QUALITY_LEVELS.filter((o) => o.description);
    assert.equal(withWarning.length, 1);
    assert.equal(withWarning[0].level, "audio-only");
    assert.equal(withWarning[0].description, "Bu seçenek kameranı kapatır.");
    assert.equal(withWarning[0].audioOnly, true);
  });

  it("issues audio-only as a single setAudioOnly(true) command", () => {
    assert.deepEqual(videoQualityCommands("audio-only"), [
      { command: "setAudioOnly", args: [true] },
    ]);
  });

  it("clears audio-only before setting the receive resolution", () => {
    assert.deepEqual(videoQualityCommands("balanced"), [
      { command: "setAudioOnly", args: [false] },
      { command: "setVideoQuality", args: [360] },
    ]);
    assert.deepEqual(videoQualityCommands("high"), [
      { command: "setAudioOnly", args: [false] },
      { command: "setVideoQuality", args: [720] },
    ]);
  });

  it("maps confirmed Jitsi state back to a level", () => {
    assert.equal(videoQualityLevelFromState(true, 720), "audio-only");
    assert.equal(videoQualityLevelFromState(false, 180), "low");
    assert.equal(videoQualityLevelFromState(false, 360), "balanced");
    assert.equal(videoQualityLevelFromState(false, 720), "high");
    assert.equal(videoQualityLevelFromState(false, null), "balanced");
  });

  it("parses quality events safely", () => {
    assert.equal(videoHeightFromEvent({ videoQuality: 360 }), 360);
    assert.equal(videoHeightFromEvent({}), null);
    // The handbook documents { audioOnlyChanged }, Jitsi's API.js actually
    // sends { enabled }, and the renamed low-bandwidth event does too. Reading
    // only the documented key is why "En iyi performans" always failed while
    // the camera really did turn off.
    assert.equal(audioOnlyFromEvent({ audioOnlyChanged: true }), true);
    assert.equal(audioOnlyFromEvent({ audioOnlyChanged: false }), false);
    assert.equal(audioOnlyFromEvent({ enabled: true }), true);
    assert.equal(audioOnlyFromEvent({ enabled: false }), false);
    assert.equal(audioOnlyFromEvent({ lowBandwidthMode: true }), true);
    assert.equal(audioOnlyFromEvent({}), null);
    assert.equal(audioOnlyFromEvent(null), null);
    assert.equal(audioOnlyFromEvent({ enabled: "yes" }), null);
  });

  it("confirms audio-only from its event so no false failure is shown", () => {
    // Simulate the page's event-confirm state: setAudioOnly(true) applied,
    // then the audioOnlyChanged event arrives.
    const audioOnly = audioOnlyFromEvent({ audioOnlyChanged: true });
    assert.equal(audioOnly, true);
    assert.equal(videoQualityLevelFromState(audioOnly ?? false, 720), "audio-only");
  });

  it("confirms the return from audio-only to a video level", () => {
    // Leaving audio-only: audioOnlyChanged false, then videoQualityChanged.
    const audioOnly = audioOnlyFromEvent({ audioOnlyChanged: false });
    const height = videoHeightFromEvent({ videoQuality: 360 });
    assert.equal(audioOnly, false);
    assert.equal(videoQualityLevelFromState(audioOnly ?? false, height), "balanced");
  });
});

describe("whiteboard + filmstrip event parsing", () => {
  it("maps whiteboard status to visibility", () => {
    assert.equal(whiteboardVisibleFromEvent({ status: "SHOWN" }), true);
    assert.equal(whiteboardVisibleFromEvent({ status: "INSTANTIATED" }), true);
    assert.equal(whiteboardVisibleFromEvent({ status: "HIDDEN" }), false);
    assert.equal(whiteboardVisibleFromEvent({ status: "RESET" }), false);
    assert.equal(whiteboardVisibleFromEvent({ status: "WHATEVER" }), null);
    assert.equal(whiteboardVisibleFromEvent(null), null);
  });

  it("parses filmstrip visibility", () => {
    assert.equal(filmstripVisibleFromEvent({ visible: true }), true);
    assert.equal(filmstripVisibleFromEvent({ visible: false }), false);
    assert.equal(filmstripVisibleFromEvent({}), null);
  });

  it("only toggles the filmstrip when real state disagrees with preference", () => {
    // Hidden preference + already hidden → no toggle.
    assert.equal(filmstripToggleNeeded(true, false), false);
    // Hidden preference + currently visible → one toggle.
    assert.equal(filmstripToggleNeeded(true, true), true);
    // Shown preference + currently hidden → one toggle.
    assert.equal(filmstripToggleNeeded(false, false), true);
    // Shown preference + already visible → no toggle.
    assert.equal(filmstripToggleNeeded(false, true), false);
    // Real visibility unknown → never toggle blindly.
    assert.equal(filmstripToggleNeeded(true, null), false);
    assert.equal(filmstripToggleNeeded(false, null), false);
  });
});

describe("capability checks", () => {
  it("reports available controls from supported command/event lists", () => {
    const caps = checkJitsiCapabilities(
      ["setAudioOnly", "setVideoQuality", "toggleFilmStrip", "toggleWhiteboard", "toggleShareScreen"],
      ["videoQualityChanged", "audioOnlyChanged", "filmstripDisplayChanged"]
    );
    assert.deepEqual(caps, {
      videoQuality: true,
      filmstrip: true,
      whiteboard: true,
      screenShare: true,
    });
  });

  it("marks a control unavailable when its command is missing", () => {
    const caps = checkJitsiCapabilities(["setVideoQuality"], ["videoQualityChanged"]);
    assert.equal(caps.videoQuality, false); // no audio-only command at all
    assert.equal(caps.filmstrip, false);
    assert.equal(caps.whiteboard, false);
  });

  it("keeps video quality available on a release that renamed setAudioOnly", () => {
    // Jitsi commit 97c1e557 (2026-07-17) renamed setAudioOnly to
    // setLowBandwidthMode with no alias; JaaS ships it whenever it ships it.
    const caps = checkJitsiCapabilities(
      ["setLowBandwidthMode", "setVideoQuality"],
      ["videoQualityChanged", "lowBandwidthModeChanged"]
    );
    assert.equal(caps.videoQuality, true);
  });

  it("does not require the confirmation events", () => {
    // Jitsi sends no event when the chosen level is already the active one,
    // so gating the feature on events made a working setting look broken.
    const caps = checkJitsiCapabilities(["setAudioOnly", "setVideoQuality"], []);
    assert.equal(caps.videoQuality, true);
  });
});

describe("audio-only command naming", () => {
  it("prefers the name the running release advertises", () => {
    assert.equal(audioOnlyCommandName(["setAudioOnly", "setVideoQuality"]), "setAudioOnly");
    assert.equal(
      audioOnlyCommandName(["setLowBandwidthMode", "setVideoQuality"]),
      "setLowBandwidthMode"
    );
    // Before the probe answers, keep today's name.
    assert.equal(audioOnlyCommandName([]), "setAudioOnly");
  });

  it("builds the command sequence with the supported name", () => {
    assert.deepEqual(videoQualityCommands("audio-only", ["setLowBandwidthMode"]), [
      { command: "setLowBandwidthMode", args: [true] },
    ]);
    assert.deepEqual(videoQualityCommands("balanced", ["setLowBandwidthMode"]), [
      { command: "setLowBandwidthMode", args: [false] },
      { command: "setVideoQuality", args: [360] },
    ]);
  });

  it("listens for both spellings of the audio-only event", () => {
    assert.deepEqual(AUDIO_ONLY_EVENTS, ["audioOnlyChanged", "lowBandwidthModeChanged"]);
  });
});

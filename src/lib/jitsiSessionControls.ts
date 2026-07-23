export type LessonParticipantRole = "student" | "tutor" | undefined;

export function getLessonJitsiToolbarButtons(role: LessonParticipantRole) {
  // No native "hangup": leaving goes through the host "Görüşmeden ayrıl" control
  // + confirmation modal (see LeaveConfirmDialog), which then calls the official
  // executeCommand("hangup"). A native red button would bypass the confirmation.
  return [
    "microphone",
    "camera",
    "chat",
    ...(role === "tutor" ? ["whiteboard", "desktop"] : []),
  ];
}

export function getLessonJitsiConfigOverwrite(role: LessonParticipantRole) {
  return {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: true,
    prejoinConfig: {
      enabled: true,
      // Hide the name field in prejoin: the name is already set authoritatively
      // by the JaaS JWT context.user.name.
      hideDisplayName: true,
      hideExtraJoinButtons: ["no-audio", "by-phone"],
    },
    // Lock the display name everywhere (prejoin + in-meeting profile). Must be
    // used together with a JWT name so the user cannot override it.
    readOnlyName: true,
    disableAddingBackgroundImages: false,
    disablePolls: true,
    disableSelfDemote: true,
    transcription: { enabled: false },
    fileSharing: { enabled: false },
    hideConferenceSubject: true,
    // Single Hocam countdown is authoritative — hide Jitsi's own conference
    // timer (official current key is timeTimer.enabled) and connection quality
    // indicators so there is exactly one clock on screen.
    timeTimer: { enabled: false },
    // Defensive, multi-layer suppression of the connection-quality popup
    // (signal icon on participant tiles). JaaS rolling releases may ignore
    // individual keys, so we set all of them.
    connectionIndicators: {
      disabled: true,
      autoHide: true,
      autoHideTimeout: 0,
      inactiveDisabled: true,
      disableDetails: true,
    },
    disableShowMoreStats: true,
    // Keep the remote tile in the filmstrip (so the whiteboard-side "teacher
    // video" area behaves predictably) instead of the 1:1 stage swap.
    disable1On1Mode: true,
    toolbarButtons: getLessonJitsiToolbarButtons(role),
    // Prune the remote participant context menu: no kick, no private message,
    // no grant moderator. Falls back to click interception if JaaS ignores the
    // hide flags. The single "Mute" action is intentionally NOT listed here so
    // it remains available.
    remoteVideoMenu: {
      disableKick: true,
      disableGrantModerator: true,
      disablePrivateChat: true,
      disableDemote: true,
    },
    participantMenuButtonsWithNotifyClick: [
      "kick",
      "grant-moderator",
      "privateMessage",
      "mute-others",
      "mute-others-video",
      "send-participant-to-room",
    ],
    // Participants-pane defense in depth: hide the moderator bulk-action
    // buttons that duplicate the same dangerous operations.
    participantsPane: {
      hideModeratorSettingsTab: true,
      hideMoreActionsButton: true,
      hideMuteAllButton: true,
    },
  };
}

export function screenSharingStateFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object" || !("on" in event)) return null;
  return typeof event.on === "boolean" ? event.on : null;
}

export function getScreenShareButtonLabel(isSharing: boolean) {
  return isSharing ? "Paylaşımı durdur" : "Ekran paylaş";
}

// ---------------------------------------------------------------------------
// Video quality
// ---------------------------------------------------------------------------

export type VideoQualityLevel = "audio-only" | "low" | "balanced" | "high";

export interface VideoQualityOption {
  level: VideoQualityLevel;
  label: string;
  description: string;
  /** Official Jitsi audio-only mode (stops sending/receiving video). */
  audioOnly: boolean;
  /** Target receive resolution height for setVideoQuality (ignored if audioOnly). */
  height: number;
}

/** Ordered best-performance → best-quality (matches the slider order). */
export const VIDEO_QUALITY_LEVELS: VideoQualityOption[] = [
  {
    level: "audio-only",
    label: "En iyi performans",
    description: "Bu seçenek kameranı kapatır.",
    audioOnly: true,
    height: 180,
  },
  {
    level: "low",
    label: "Düşük görüntü kalitesi",
    description: "",
    audioOnly: false,
    height: 180,
  },
  {
    level: "balanced",
    label: "Dengeli",
    description: "",
    audioOnly: false,
    height: 360,
  },
  {
    level: "high",
    label: "En yüksek görüntü kalitesi",
    description: "",
    audioOnly: false,
    height: 720,
  },
];

export const DEFAULT_VIDEO_QUALITY_LEVEL: VideoQualityLevel = "balanced";

export function getVideoQualityOption(level: VideoQualityLevel): VideoQualityOption {
  return (
    VIDEO_QUALITY_LEVELS.find((o) => o.level === level) ??
    VIDEO_QUALITY_LEVELS.find((o) => o.level === DEFAULT_VIDEO_QUALITY_LEVEL)!
  );
}

export interface JitsiCommand {
  command: string;
  args: unknown[];
}

/**
 * Command sequence to apply a quality level. Audio-only toggles the official
 * audioOnly mode; the video levels clear audio-only first, then set the receive
 * resolution — order matters so a switch away from audio-only re-enables video.
 */
export function videoQualityCommands(level: VideoQualityLevel): JitsiCommand[] {
  const option = getVideoQualityOption(level);
  if (option.audioOnly) {
    return [{ command: "setAudioOnly", args: [true] }];
  }
  return [
    { command: "setAudioOnly", args: [false] },
    { command: "setVideoQuality", args: [option.height] },
  ];
}

/** Maps confirmed Jitsi state (audioOnly + last video height) back to a level. */
export function videoQualityLevelFromState(
  audioOnly: boolean,
  height: number | null
): VideoQualityLevel {
  if (audioOnly) return "audio-only";
  if (height === null) return DEFAULT_VIDEO_QUALITY_LEVEL;
  if (height <= 180) return "low";
  if (height <= 360) return "balanced";
  return "high";
}

/** Parses videoQualityChanged → the received video height, or null. */
export function videoHeightFromEvent(event: unknown): number | null {
  if (!event || typeof event !== "object") return null;
  const value = (event as { videoQuality?: unknown }).videoQuality;
  return typeof value === "number" ? value : null;
}

/**
 * Parses audioOnlyChanged → whether audio-only is enabled, or null.
 * The official payload is `{ audioOnlyChanged: boolean }`.
 */
export function audioOnlyFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object") return null;
  const value = (event as { audioOnlyChanged?: unknown }).audioOnlyChanged;
  return typeof value === "boolean" ? value : null;
}

// ---------------------------------------------------------------------------
// Whiteboard + filmstrip
// ---------------------------------------------------------------------------

/**
 * Parses whiteboardStatusChanged. SHOWN/INSTANTIATED → visible, HIDDEN/RESET →
 * hidden, anything else → null (leave state unchanged).
 */
export function whiteboardVisibleFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object") return null;
  const status = (event as { status?: unknown }).status;
  if (typeof status !== "string") return null;
  const normalized = status.toUpperCase();
  if (normalized === "SHOWN" || normalized === "INSTANTIATED") return true;
  if (normalized === "HIDDEN" || normalized === "RESET") return false;
  return null;
}

/** Parses filmstripDisplayChanged → whether the filmstrip is visible, or null. */
export function filmstripVisibleFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object") return null;
  const value = (event as { visible?: unknown }).visible;
  return typeof value === "boolean" ? value : null;
}

/**
 * Whether a single toggleFilmStrip command is needed to reconcile the actual
 * filmstrip visibility with the student's stored preference.
 *
 * The filmstrip's real visibility must be known first: when it is `null`
 * (no filmstripDisplayChanged event yet) we never toggle blindly — the caller
 * waits for the event. `prefHidden` true means the student wants the teacher's
 * video hidden, i.e. the filmstrip not visible.
 */
export function filmstripToggleNeeded(
  prefHidden: boolean,
  filmstripVisible: boolean | null
): boolean {
  if (filmstripVisible === null) return false;
  const desiredVisible = !prefHidden;
  return filmstripVisible !== desiredVisible;
}

// ---------------------------------------------------------------------------
// Capability checks (rolling JaaS releases may lag on newer commands/events)
// ---------------------------------------------------------------------------

export const REQUIRED_QUALITY_COMMANDS = ["setAudioOnly", "setVideoQuality"];
export const REQUIRED_QUALITY_EVENTS = ["videoQualityChanged", "audioOnlyChanged"];
export const REQUIRED_FILMSTRIP_COMMANDS = ["toggleFilmStrip"];
export const REQUIRED_FILMSTRIP_EVENTS = ["filmstripDisplayChanged"];

export interface JitsiCapabilities {
  videoQuality: boolean;
  filmstrip: boolean;
  whiteboard: boolean;
  screenShare: boolean;
}

function hasAll(available: string[], required: string[]): boolean {
  return required.every((name) => available.includes(name));
}

export function checkJitsiCapabilities(
  supportedCommands: string[],
  supportedEvents: string[]
): JitsiCapabilities {
  return {
    videoQuality:
      hasAll(supportedCommands, REQUIRED_QUALITY_COMMANDS) &&
      hasAll(supportedEvents, REQUIRED_QUALITY_EVENTS),
    filmstrip:
      hasAll(supportedCommands, REQUIRED_FILMSTRIP_COMMANDS) &&
      hasAll(supportedEvents, REQUIRED_FILMSTRIP_EVENTS),
    whiteboard: supportedCommands.includes("toggleWhiteboard"),
    screenShare: supportedCommands.includes("toggleShareScreen"),
  };
}

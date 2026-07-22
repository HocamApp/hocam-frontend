export type LessonParticipantRole = "student" | "tutor" | undefined;

export function getLessonJitsiToolbarButtons(role: LessonParticipantRole) {
  return [
    "microphone",
    "camera",
    "chat",
    ...(role === "tutor" ? ["whiteboard", "desktop"] : []),
    "hangup",
  ];
}

export function getLessonJitsiConfigOverwrite(role: LessonParticipantRole) {
  return {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: true,
    disableAddingBackgroundImages: false,
    disablePolls: true,
    transcription: { enabled: false },
    fileSharing: { enabled: false },
    hideConferenceSubject: true,
    toolbarButtons: getLessonJitsiToolbarButtons(role),
  };
}

export function screenSharingStateFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object" || !("on" in event)) return null;
  return typeof event.on === "boolean" ? event.on : null;
}

export function getScreenShareButtonLabel(isSharing: boolean) {
  return isSharing ? "Paylaşımı durdur" : "Ekran paylaş";
}

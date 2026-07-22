export type LessonParticipantRole = "student" | "tutor" | undefined;

export function getLessonJitsiToolbarButtons(role: LessonParticipantRole) {
  return [
    "microphone",
    "camera",
    "chat",
    ...(role === "tutor" ? ["whiteboard", "desktop"] : []),
    "tileview",
    "hangup",
  ];
}

export function screenSharingStateFromEvent(event: unknown): boolean | null {
  if (!event || typeof event !== "object" || !("on" in event)) return null;
  return typeof event.on === "boolean" ? event.on : null;
}

export function getScreenShareButtonLabel(isSharing: boolean) {
  return isSharing ? "Paylaşımı durdur" : "Ekran paylaş";
}

"use client";

import { VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";

interface TeacherVideoControlProps {
  /** Whether the student has hidden the teacher's filmstrip video locally. */
  isVideoHidden: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Student-only control shown while the whiteboard is open: locally hides or
 * shows the tutor's filmstrip tile (Jitsi's own remote video) beside the board.
 * Purely a local view toggle — it never touches the tutor's camera.
 */
export function TeacherVideoControl({
  isVideoHidden,
  onToggle,
  disabled,
}: TeacherVideoControlProps) {
  const label = isVideoHidden
    ? "Öğretmen videosunu göster"
    : "Öğretmen videosunu gizle";
  const Icon = isVideoHidden ? VideoCameraSlash : VideoCamera;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isVideoHidden}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors duration-[--duration-state] hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

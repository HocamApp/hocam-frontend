"use client";

import { Video, VideoOff } from "lucide-react";

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
  const Icon = isVideoHidden ? VideoOff : Video;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isVideoHidden}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

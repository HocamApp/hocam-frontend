"use client";

import {
  ChatCircle,
  Microphone,
  MicrophoneSlash,
  Monitor,
  PencilSimple,
  VideoCamera,
  VideoCameraSlash,
} from "@phosphor-icons/react";

interface MockJitsiToolbarProps {
  micOn: boolean;
  camOn: boolean;
  chatOpen: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleChat: () => void;
  /** data-tutorial-target of the currently focusable control group. */
  activeTargets: string[];
}

/**
 * Replica of the Jitsi iframe's bottom toolbar (mic/camera/chat + the tutor's
 * whiteboard/desktop pills). The real controls live INSIDE the JaaS iframe
 * (see getLessonJitsiToolbarButtons) and cannot be spotlighted or modified, so
 * the tutorial teaches them on this lookalike. No getUserMedia is ever called.
 */
export function MockJitsiToolbar({
  micOn,
  camOn,
  chatOpen,
  onToggleMic,
  onToggleCam,
  onToggleChat,
  activeTargets,
}: MockJitsiToolbarProps) {
  const avTabbable = activeTargets.includes("jitsi-av");
  const chatTabbable = activeTargets.includes("jitsi-chat");
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-pill border border-line bg-surface px-3 py-2 shadow-float">
      <div data-tutorial-target="jitsi-av" className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleMic}
          tabIndex={avTabbable ? 0 : -1}
          aria-pressed={!micOn}
          aria-label={micOn ? "Mikrofonu kapat" : "Mikrofonu aç"}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-[var(--duration-state)] ${
            micOn ? "bg-paper text-ink hover:bg-line" : "bg-error text-white"
          }`}
        >
          {micOn ? <Microphone className="h-4 w-4" /> : <MicrophoneSlash className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onToggleCam}
          tabIndex={avTabbable ? 0 : -1}
          aria-pressed={!camOn}
          aria-label={camOn ? "Kamerayı kapat" : "Kamerayı aç"}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-[var(--duration-state)] ${
            camOn ? "bg-paper text-ink hover:bg-line" : "bg-error text-white"
          }`}
        >
          {camOn ? <VideoCamera className="h-4 w-4" /> : <VideoCameraSlash className="h-4 w-4" />}
        </button>
      </div>
      <button
        type="button"
        data-tutorial-target="jitsi-chat"
        onClick={onToggleChat}
        tabIndex={chatTabbable ? 0 : -1}
        aria-pressed={chatOpen}
        aria-label="Sohbeti aç/kapat"
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-[var(--duration-state)] ${
          chatOpen ? "bg-pink text-white" : "bg-paper text-ink hover:bg-line"
        }`}
      >
        <ChatCircle className="h-4 w-4" />
      </button>
      {/* Display-only tutor pills for realism; the host bar teaches these. */}
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink-mid">
        <PencilSimple className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink-mid">
        <Monitor className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  );
}

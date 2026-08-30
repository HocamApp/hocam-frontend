"use client";

/**
 * Faz 5 shared JaaS primitives. Deliberately NOT a refactor of
 * jitsiSessionControls.ts — that file's getLessonJitsiConfigOverwrite stays
 * byte-identical (Faz 5 Final Revision §14: smallest possible diff to
 * lesson code). Coaching gets its own small config here instead of reusing
 * the lesson one, because coaching has no whiteboard/teacher-video toggle,
 * no classroom question controls, and no classroom-bulk-moderation needs
 * — importing the lesson config would drag in UI affordances coaching
 * never uses. The handful of genuinely universal flags (no
 * recording/transcription, locked display name, single-timer, suppressed
 * connection-quality popup) are duplicated here rather than shared via
 * import, so this file has zero risk of changing lesson behavior.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function getCoachingJitsiConfigOverwrite() {
  return {
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    prejoinPageEnabled: true,
    prejoinConfig: {
      enabled: true,
      hideDisplayName: true,
      hideExtraJoinButtons: ["no-audio", "by-phone"],
    },
    readOnlyName: true,
    disablePolls: true,
    disableSelfDemote: true,
    transcription: { enabled: false },
    fileSharing: { enabled: false },
    hideConferenceSubject: true,
    timeTimer: { enabled: false },
    connectionIndicators: {
      disabled: true,
      autoHide: true,
      autoHideTimeout: 0,
      inactiveDisabled: true,
      disableDetails: true,
    },
    disableShowMoreStats: true,
    toolbarButtons: ["microphone", "camera", "chat", "desktop"],
    remoteVideoMenu: {
      disableKick: true,
      disableGrantModerator: true,
      disablePrivateChat: true,
      disableDemote: true,
    },
    participantsPane: {
      hideModeratorSettingsTab: true,
      hideMoreActionsButton: true,
      hideMuteAllButton: true,
    },
  };
}

export const COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE = {
  SHOW_JITSI_WATERMARK: false,
  SHOW_BRAND_WATERMARK: false,
  SHOW_POWERED_BY: false,
  DEFAULT_BACKGROUND: "#111827",
  CONNECTION_INDICATOR_DISABLED: true,
};

const RECONNECT_ATTEMPT_DELAY_MS = 12_000;

/**
 * Small, reusable version of the reconnect pattern already proven in the
 * lesson session page (connectionInterrupted/connectionRestored -> remount
 * the embed via a changing `key`). Returns the current key and the two
 * event handlers to wire into JitsiMeeting's onApiReady listeners.
 */
export function useJaasReconnect() {
  const [embedKey, setEmbedKey] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "interrupted">("connected");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const onConnectionInterrupted = useCallback(() => {
    setConnectionStatus("interrupted");
    timeoutRef.current = window.setTimeout(() => {
      setEmbedKey((k) => k + 1);
    }, RECONNECT_ATTEMPT_DELAY_MS);
  }, []);

  const onConnectionRestored = useCallback(() => {
    setConnectionStatus("connected");
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { embedKey, connectionStatus, onConnectionInterrupted, onConnectionRestored };
}

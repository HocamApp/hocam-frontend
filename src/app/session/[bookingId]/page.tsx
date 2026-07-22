"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion, MonitorUp, PencilRuler, StickyNote, Video, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchBookings,
  fetchSessionToken,
  sendBookingHeartbeat,
} from "@/lib/lessonsApi";
import { useAuth } from "@/hooks/useAuth";
import { useLessonSessionState } from "@/hooks/useLessonSessionState";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  audioOnlyFromEvent,
  checkJitsiCapabilities,
  DEFAULT_VIDEO_QUALITY_LEVEL,
  filmstripToggleNeeded,
  filmstripVisibleFromEvent,
  getLessonJitsiConfigOverwrite,
  getScreenShareButtonLabel,
  screenSharingStateFromEvent,
  videoHeightFromEvent,
  videoQualityCommands,
  videoQualityLevelFromState,
  whiteboardVisibleFromEvent,
  type JitsiCapabilities,
  type VideoQualityLevel,
} from "@/lib/jitsiSessionControls";
import {
  computeCountdown,
  teacherVideoStorageKey,
  videoQualityStorageKey,
} from "@/lib/lessonSessionState";
import {
  createPresenceTracker,
  handleJoin,
  handleLeave,
  parseParticipantJoined,
  parseParticipantLeft,
  setLocalParticipant,
} from "@/lib/lessonPresence";
import { LessonTimerControl } from "@/components/lessons/LessonTimerControl";
import { VideoQualityDialog } from "@/components/lessons/VideoQualityDialog";
import { EarlyEndRequestDialog } from "@/components/lessons/EarlyEndRequestDialog";
import { LeaveConfirmDialog } from "@/components/lessons/LeaveConfirmDialog";
import { TeacherVideoControl } from "@/components/lessons/TeacherVideoControl";
import type { Booking } from "@/types";
import { LessonQuestionPanel } from "@/components/questions/LessonQuestionPanel";
import { LessonQuestionInvitationDialog } from "@/components/questions/LessonQuestionInvitationDialog";
import { useLessonQuestionSession } from "@/components/questions/useLessonQuestionSession";
import { TutorStudentPrivateWorkspace } from "@/components/tutors/TutorStudentPrivateWorkspace";

const EARLY_JOIN_MINUTES = 15;
const HEARTBEAT_INTERVAL_MS = 60_000;
const RECONNECT_ATTEMPT_DELAY_MS = 12_000;
const QUALITY_CONFIRM_TIMEOUT_MS = 3_000;
// Join/leave toasts stay silent for this long after (re)connect, so the initial
// participant roster and reconnect bursts don't spam.
const PRESENCE_SETTLE_MS = 1_500;
const PRESENCE_TOAST_MS = 4_000;
const ENDED_STATUSES = new Set([
  "awaiting_confirmation",
  "completed",
  "disputed",
  "cancelled",
]);

type JitsiApi = {
  executeCommand?: (name: string, ...args: unknown[]) => void;
  addEventListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeEventListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  getSupportedCommands?: () => string[] | Promise<string[]>;
  getSupportedEvents?: () => string[] | Promise<string[]>;
};

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false }
);

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function scheduledEndTime(booking: Booking) {
  return (
    new Date(booking.start_time).getTime() + booking.duration_minutes * 60_000
  );
}

function LessonWaitingRoom({
  booking,
  onBack,
}: {
  booking: Booking;
  onBack: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const startAt = new Date(booking.start_time).getTime();
  const joinAt = startAt - EARLY_JOIN_MINUTES * 60 * 1000;
  const timeToJoin = joinAt - now;
  const tutorName = `${booking.tutor.name} ${booking.tutor.surname}`.trim();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-1 overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-8 flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <div className="lesson-waiting-ring flex h-32 w-32 items-center justify-center rounded-full border border-sky-300/40">
            <Video className="h-10 w-10 text-sky-200" aria-hidden="true" />
          </div>
        </div>

        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
          Ders odası {EARLY_JOIN_MINUTES} dakika kala açılır
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
          Birazdan derse gireceksin
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          {booking.subject.name} dersi {tutorName ? `${tutorName} ile ` : ""}
          {formatDate(booking.start_time)} tarihinde başlayacak. Oda açılana kadar
          burada sakin bir bekleme ekranı gösteriyoruz.
        </p>

        <div className="mt-8 rounded-lg border border-white/10 bg-white/5 px-6 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Odaya girişe kalan
          </p>
          <p className="mt-2 text-4xl font-semibold tabular-nums">
            {formatCountdown(timeToJoin)}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            disabled={timeToJoin > 0}
          >
            <Video className="mr-2 h-4 w-4" />
            Derse Katıl
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            Geri dön
          </Button>
        </div>
      </div>

      <style jsx>{`
        .lesson-waiting-ring {
          animation: waiting-pulse 2.8s ease-in-out infinite;
        }

        @keyframes waiting-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(125, 211, 252, 0.22);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 24px rgba(125, 211, 252, 0);
            transform: scale(1.04);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lesson-waiting-ring {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function LessonEndedScreen({
  booking,
  onGoToDashboard,
}: {
  booking: Booking;
  onGoToDashboard: () => void;
}) {
  const isAwaitingConfirmation = booking.status === "awaiting_confirmation";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-950 px-6 py-10 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <Video className="h-7 w-7 text-sky-200" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold">Ders sona erdi</h1>
      <p className="max-w-md text-sm text-slate-300">
        {isAwaitingConfirmation
          ? "Ders tamamlandı olarak işaretlendi. Panelindeki onay kartından dersi onaylayabilir veya bir sorun bildirebilirsin."
          : "Bu ders artık aktif değil. Detayları panelinden görebilirsin."}
      </p>
      <Button onClick={onGoToDashboard}>Panelime dön</Button>
    </div>
  );
}

function SessionContent() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isTutor = user?.role === "tutor";
  const isStudent = user?.role === "student";

  const tutorProfileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isTutor,
    retry: false,
  });

  useEffect(() => {
    if (isTutor && tutorProfileQuery.data && !tutorProfileQuery.data.is_verified) {
      router.replace("/tutor/onboarding");
    }
  }, [router, tutorProfileQuery.data, isTutor]);

  const [now, setNow] = useState(() => Date.now());
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "interrupted"
  >("connected");
  const [jitsiKey, setJitsiKey] = useState(0);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [capabilities, setCapabilities] = useState<JitsiCapabilities>({
    videoQuality: true,
    filmstrip: true,
    whiteboard: true,
    screenShare: true,
  });

  // Video quality state (event-confirmed).
  const [qualityDialogOpen, setQualityDialogOpen] = useState(false);
  const [confirmedQuality, setConfirmedQuality] = useState<VideoQualityLevel>(
    DEFAULT_VIDEO_QUALITY_LEVEL
  );
  const [pendingQuality, setPendingQuality] = useState<VideoQualityLevel | null>(null);
  const [qualityError, setQualityError] = useState(false);
  const desiredQualityRef = useRef<VideoQualityLevel | null>(null);
  const qualityTimeoutRef = useRef<number | null>(null);
  const jitsiAudioOnlyRef = useRef(false);
  const jitsiHeightRef = useRef<number | null>(null);

  // Whiteboard / teacher-video (student side) state. filmstripVisible is the
  // real Jitsi filmstrip visibility (null = not yet known from an event); we
  // never toggle blindly against an unknown state.
  const [whiteboardVisible, setWhiteboardVisible] = useState(false);
  const [filmstripVisible, setFilmstripVisible] = useState<boolean | null>(null);
  const [storedTeacherPrefHidden, setStoredTeacherPrefHidden] = useState(false);
  const teacherPrefAppliedRef = useRef(false);

  // Leave-confirmation flow (distinct from the "Dersi bitir" early-end flow).
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveInFlightRef = useRef(false);

  // Join/leave toasts: presence tracker persists across iframe remounts so a
  // reconnect does not re-toast already-present peers. announceRef gates the
  // toasts off during the initial roster burst and during a reconnect settle
  // window, while the tracker keeps recording so later leaves resolve correctly.
  const presenceRef = useRef(createPresenceTracker());
  const announceRef = useRef(false);
  const announceTimeoutRef = useRef<number | null>(null);

  const reconnectTimeoutRef = useRef<number | null>(null);
  const questionButtonRef = useRef<HTMLButtonElement>(null);
  const qualityButtonRef = useRef<HTMLButtonElement>(null);
  const endButtonRef = useRef<HTMLButtonElement>(null);
  const leaveButtonRef = useRef<HTMLButtonElement>(null);

  const { data: bookings, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    // Live status now comes from the 2s session-state controller; only poll the
    // booking list before the session is live, to avoid a duplicate poll.
    refetchInterval: (query) => {
      const current = query.state.data?.find((b) => b.id === bookingId);
      return current?.status === "confirmed" ? 10_000 : false;
    },
  });

  const booking = bookings?.find((b) => b.id === bookingId);
  const studentTooEarly = useMemo(() => {
    if (!booking || !isStudent) return false;
    const status = (booking.status || "").toLowerCase();
    if (status !== "confirmed") return false;
    const joinAt =
      new Date(booking.start_time).getTime() - EARLY_JOIN_MINUTES * 60 * 1000;
    return now < joinAt;
  }, [booking, now, isStudent]);
  const lessonWindowEnded = Boolean(booking && now >= scheduledEndTime(booking));

  const {
    data: sessionToken,
    isLoading: isLoadingToken,
    isError: isTokenError,
  } = useQuery({
    queryKey: ["session-token", bookingId],
    queryFn: () => fetchSessionToken(bookingId),
    retry: false,
    enabled:
      Boolean(bookingId) &&
      Boolean(booking) &&
      !studentTooEarly &&
      !lessonWindowEnded,
  });

  const sessionEndedFromBooking = Boolean(
    booking && (ENDED_STATUSES.has(booking.status) || lessonWindowEnded)
  );
  const inSession =
    Boolean(booking) &&
    !studentTooEarly &&
    Boolean(sessionToken) &&
    !sessionEndedFromBooking;

  // The single, server-synced session-state controller.
  const session = useLessonSessionState({ bookingId, enabled: inSession });
  const liveStatus = session.state?.status ?? booking?.status;
  const sessionEnded =
    sessionEndedFromBooking ||
    Boolean(liveStatus && ENDED_STATUSES.has(liveStatus));

  const questionSession = useLessonQuestionSession({
    bookingId,
    enabled: inSession && !sessionEnded,
    isStudent,
  });

  // Countdown driven by the drift-corrected server clock.
  const startTimeIso = session.state?.start_time ?? booking?.start_time;
  const scheduledEndIso =
    session.state?.scheduled_end ??
    (booking ? new Date(scheduledEndTime(booking)).toISOString() : undefined);
  const countdown = useMemo(() => {
    if (!startTimeIso || !scheduledEndIso) return null;
    return computeCountdown(startTimeIso, scheduledEndIso, now + session.serverOffsetMs);
  }, [startTimeIso, scheduledEndIso, now, session.serverOffsetMs]);

  // Ticks once a second while in session (drives the countdown display).
  useEffect(() => {
    if (!inSession) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [inSession]);

  // Attendance heartbeat: fires on join, then every 60s; paused while hidden.
  useEffect(() => {
    if (!inSession || !bookingId) return;
    let intervalId: number | null = null;
    const ping = () => {
      sendBookingHeartbeat(bookingId).catch(() => {});
    };
    const start = () => {
      if (intervalId !== null) return;
      ping();
      intervalId = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };
    if (!document.hidden) start();
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [inSession, bookingId]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) window.clearTimeout(reconnectTimeoutRef.current);
      if (qualityTimeoutRef.current) window.clearTimeout(qualityTimeoutRef.current);
      if (announceTimeoutRef.current) window.clearTimeout(announceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sessionEnded) return;
    try {
      jitsiApi?.executeCommand?.("hangup");
    } catch {
      // Meeting may already be closed — nothing to clean up.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEnded]);

  // --- Video quality: apply + event-confirm ---------------------------------
  const applyQuality = useCallback(
    (level: VideoQualityLevel) => {
      if (!jitsiApi?.executeCommand || !capabilities.videoQuality) return;
      setPendingQuality(level);
      setQualityError(false);
      desiredQualityRef.current = level;
      try {
        for (const { command, args } of videoQualityCommands(level)) {
          jitsiApi.executeCommand(command, ...args);
        }
      } catch {
        setQualityError(true);
        setPendingQuality(null);
        desiredQualityRef.current = null;
        return;
      }
      if (qualityTimeoutRef.current) window.clearTimeout(qualityTimeoutRef.current);
      qualityTimeoutRef.current = window.setTimeout(() => {
        if (desiredQualityRef.current === level) {
          setQualityError(true);
          setPendingQuality(null);
          desiredQualityRef.current = null;
        }
      }, QUALITY_CONFIRM_TIMEOUT_MS);
    },
    [jitsiApi, capabilities.videoQuality]
  );

  const reconcileQualityFromEvents = useCallback(() => {
    const level = videoQualityLevelFromState(
      jitsiAudioOnlyRef.current,
      jitsiHeightRef.current
    );
    setConfirmedQuality(level);
    if (desiredQualityRef.current === level) {
      if (qualityTimeoutRef.current) window.clearTimeout(qualityTimeoutRef.current);
      setPendingQuality(null);
      setQualityError(false);
      desiredQualityRef.current = null;
      try {
        sessionStorage.setItem(videoQualityStorageKey(bookingId), level);
      } catch {
        // Preference persistence is best-effort.
      }
    }
  }, [bookingId]);

  // --- Teacher video (student, whiteboard open) -----------------------------
  // The teacher's tile in Jitsi's filmstrip is hidden when the filmstrip is not
  // visible; when the real visibility isn't known yet we fall back to the stored
  // preference for the label only (no command is issued in that state).
  const teacherVideoHidden =
    filmstripVisible === null ? storedTeacherPrefHidden : filmstripVisible === false;

  // Load the stored preference for this booking (label fallback + apply target).
  useEffect(() => {
    try {
      setStoredTeacherPrefHidden(
        sessionStorage.getItem(teacherVideoStorageKey(bookingId)) === "hidden"
      );
    } catch {
      setStoredTeacherPrefHidden(false);
    }
  }, [bookingId]);

  const toggleTeacherVideo = useCallback(() => {
    if (!jitsiApi?.executeCommand || !capabilities.filmstrip) return;
    // Optimistically flip the known visibility so the label responds instantly;
    // filmstripDisplayChanged confirms/corrects it. When still unknown, assume
    // it was visible (Jitsi default) so the first tap hides it.
    const nextVisible = filmstripVisible === null ? false : !filmstripVisible;
    setFilmstripVisible(nextVisible);
    const nextHidden = !nextVisible;
    setStoredTeacherPrefHidden(nextHidden);
    try {
      sessionStorage.setItem(
        teacherVideoStorageKey(bookingId),
        nextHidden ? "hidden" : "shown"
      );
    } catch {
      // Best-effort.
    }
    try {
      jitsiApi.executeCommand("toggleFilmStrip");
    } catch {
      toast.error("Öğretmen videosu şu anda gösterilemiyor.");
    }
  }, [jitsiApi, capabilities.filmstrip, bookingId, filmstripVisible]);

  // Apply the stored teacher-video preference once per whiteboard-open, but only
  // once the real filmstrip visibility is known — and only when it actually
  // disagrees with the preference (so no blind double toggle).
  useEffect(() => {
    if (!isStudent || !whiteboardVisible || !capabilities.filmstrip) {
      teacherPrefAppliedRef.current = false;
      return;
    }
    if (teacherPrefAppliedRef.current) return;
    if (filmstripVisible === null) return; // wait for the first event
    teacherPrefAppliedRef.current = true;
    if (filmstripToggleNeeded(storedTeacherPrefHidden, filmstripVisible)) {
      try {
        jitsiApi?.executeCommand?.("toggleFilmStrip");
      } catch {
        // Non-fatal.
      }
    }
  }, [
    isStudent,
    whiteboardVisible,
    capabilities.filmstrip,
    filmstripVisible,
    storedTeacherPrefHidden,
    jitsiApi,
  ]);

  // --- Early-end request transitions → in-session toasts --------------------
  const prevEarlyEndStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = session.earlyEnd?.status;
    const prev = prevEarlyEndStatusRef.current;
    if (status && prev && status !== prev) {
      if (isTutor && prev === "pending" && status === "declined") {
        toast.info("Öğrenci dersi sürdürmek istiyor.");
      }
      if (isStudent && prev === "pending" && status === "cancelled") {
        toast.info("Dersi bitirme isteği iptal edildi.");
      }
    }
    prevEarlyEndStatusRef.current = status;
  }, [session.earlyEnd?.status, isTutor, isStudent]);

  if (isLoadingBooking) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (booking && studentTooEarly) {
    return <LessonWaitingRoom booking={booking} onBack={() => router.back()} />;
  }

  if (booking && sessionEnded) {
    return (
      <LessonEndedScreen
        booking={booking}
        onGoToDashboard={() =>
          router.push(isTutor ? "/dashboard/tutor" : "/dashboard/student")
        }
      />
    );
  }

  if (isLoadingToken) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isTokenError || !sessionToken) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <ErrorMessage message="Bu ders için canlı ders odası henüz hazır değil." />
      </div>
    );
  }

  const displayName = user?.email?.split("@", 1)[0] ?? "Kullanıcı";

  const handleToggleWhiteboard = () => {
    if (!jitsiApi?.executeCommand) {
      toast.info("Ders odası hazırlanıyor. Birkaç saniye sonra tekrar dene.");
      return;
    }
    try {
      jitsiApi.executeCommand("toggleWhiteboard");
      toast.info("Tahta görünümü değiştirildi.");
    } catch {
      toast.error("Tahta şu anda açılamadı.");
    }
  };

  const handleToggleScreenShare = () => {
    if (!jitsiApi?.executeCommand) {
      toast.info("Ders odası hazırlanıyor. Birkaç saniye sonra tekrar dene.");
      return;
    }
    try {
      jitsiApi.executeCommand("toggleShareScreen");
    } catch {
      toast.error("Ekran paylaşımı şu anda açılamadı.");
    }
  };

  const earlyEnd = session.earlyEnd;
  const isEndPending = earlyEnd?.status === "pending";
  const serverNowMs = now + session.serverOffsetMs;
  const cooldownActive = Boolean(
    earlyEnd?.retry_available_at &&
      serverNowMs < new Date(earlyEnd.retry_available_at).getTime()
  );

  const handleRequestEnd = () => {
    session.requestEnd.mutate(undefined, {
      onSuccess: () => toast.info("İstek gönderildi. Öğrencinin onayı bekleniyor."),
      onError: () => toast.error("İstek gönderilemedi. Lütfen tekrar dene."),
    });
  };
  const handleCancelEnd = () => {
    session.cancel.mutate();
  };
  const handleAcceptEnd = () => {
    session.respond.mutate("accept");
  };
  const handleContinueEnd = () => {
    session.respond.mutate("continue");
  };

  // Leaving the conference: confirm first, then the official hangup. Guarded so
  // a double click / double submit can only fire hangup once.
  const handleConfirmLeave = () => {
    if (leaveInFlightRef.current) return;
    leaveInFlightRef.current = true;
    setIsLeaving(true);
    try {
      jitsiApi?.executeCommand?.("hangup");
    } catch {
      // Meeting may already be gone — fall through to navigation.
    }
    // onReadyToClose handles navigation; navigate as a fallback if the event
    // does not arrive (e.g. api not ready).
    if (!jitsiApi?.executeCommand) {
      router.back();
    }
  };
  const handleCancelLeave = () => {
    if (leaveInFlightRef.current) return;
    setLeaveDialogOpen(false);
  };

  const selectedQuality = pendingQuality ?? confirmedQuality;

  return (
    <div className="flex flex-1 flex-col">
      {connectionStatus === "interrupted" && (
        <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          Bağlantı koptu. Yeniden bağlanmaya çalışılıyor...
        </div>
      )}

      <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 text-sm text-white">
        <span className="min-w-0 flex-1 truncate font-medium">
          {booking ? `${booking.subject.name} — Canlı Ders` : "Canlı Ders"}
        </span>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-none">
          {countdown && (
            <LessonTimerControl
              bookingId={bookingId}
              remainingMs={countdown.remainingMs}
              elapsedMs={countdown.elapsedMs}
              isLowTime={countdown.isLowTime}
              isOvertime={countdown.isOvertime}
            />
          )}
          <button
            ref={questionButtonRef}
            onClick={() =>
              questionSession.panelOpen
                ? questionSession.closePanel()
                : questionSession.openPanel()
            }
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
            aria-expanded={questionSession.panelOpen}
            aria-controls="lesson-question-panel"
          >
            <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            Canlı soru
            {questionSession.state?.active_question && (
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" aria-label="Aktif soru var" />
            )}
          </button>
          {isTutor && booking && (
            <button
              onClick={() => setNotesPanelOpen((open) => !open)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
              aria-expanded={notesPanelOpen}
            >
              <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
              Öğrenci notları
            </button>
          )}
          {isTutor && (
            <button
              onClick={handleToggleScreenShare}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
            >
              <MonitorUp className="h-3.5 w-3.5" aria-hidden="true" />
              {getScreenShareButtonLabel(isScreenSharing)}
            </button>
          )}
          {isTutor && (
            <button
              onClick={handleToggleWhiteboard}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
            >
              <PencilRuler className="h-3.5 w-3.5" aria-hidden="true" />
              Tahtayı aç/kapat
            </button>
          )}
          <button
            ref={qualityButtonRef}
            onClick={() => setQualityDialogOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Görüntü ayarı
          </button>
          {isStudent && whiteboardVisible && (
            <TeacherVideoControl
              isVideoHidden={teacherVideoHidden}
              onToggle={toggleTeacherVideo}
              disabled={!capabilities.filmstrip}
            />
          )}
          {isTutor && !isEndPending && (
            <button
              ref={endButtonRef}
              onClick={handleRequestEnd}
              disabled={session.requestEnd.isPending || cooldownActive}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Dersi bitir
            </button>
          )}
          {isTutor && isEndPending && (
            <>
              <span className="inline-flex shrink-0 items-center rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                Öğrencinin onayı bekleniyor
              </span>
              <button
                onClick={handleCancelEnd}
                disabled={session.cancel.isPending}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                İsteği iptal et
              </button>
            </>
          )}
          <button
            ref={leaveButtonRef}
            onClick={() => setLeaveDialogOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-red-500/50 bg-red-500/20 px-3 py-1 text-xs font-medium text-red-100 transition-colors hover:bg-red-500/30"
          >
            Görüşmeden ayrıl
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <JitsiMeeting
          key={jitsiKey}
          domain={sessionToken.domain}
          roomName={sessionToken.room}
          jwt={sessionToken.token}
          lang="tr"
          userInfo={{
            displayName,
            email: user?.email ?? "",
          }}
          configOverwrite={getLessonJitsiConfigOverwrite(user?.role)}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: "#111827",
          }}
          onApiReady={(api: JitsiApi) => {
            setJitsiApi(api);
            setIsScreenSharing(false);
            setConnectionStatus("connected");
            // Fresh meeting (initial or post-reconnect remount): the real
            // filmstrip/whiteboard visibility is unknown until events arrive, so
            // reset to avoid a stale blind toggle.
            setFilmstripVisible(null);
            setWhiteboardVisible(false);
            teacherPrefAppliedRef.current = false;

            // Capability probe — disable controls whose command/event is
            // missing on this JaaS release rather than failing silently.
            Promise.resolve()
              .then(async () => {
                const cmds = (await api.getSupportedCommands?.()) ?? null;
                const evts = (await api.getSupportedEvents?.()) ?? null;
                if (cmds && evts) setCapabilities(checkJitsiCapabilities(cmds, evts));
              })
              .catch(() => {});

            api.addEventListener?.("screenSharingStatusChanged", (event?: unknown) => {
              const sharing = screenSharingStateFromEvent(event);
              if (sharing !== null) setIsScreenSharing(sharing);
            });
            api.addEventListener?.("videoQualityChanged", (event?: unknown) => {
              const height = videoHeightFromEvent(event);
              if (height !== null) jitsiHeightRef.current = height;
              reconcileQualityFromEvents();
            });
            api.addEventListener?.("audioOnlyChanged", (event?: unknown) => {
              const audioOnly = audioOnlyFromEvent(event);
              if (audioOnly !== null) jitsiAudioOnlyRef.current = audioOnly;
              reconcileQualityFromEvents();
            });
            api.addEventListener?.("whiteboardStatusChanged", (event?: unknown) => {
              const visible = whiteboardVisibleFromEvent(event);
              if (visible !== null) setWhiteboardVisible(visible);
            });
            api.addEventListener?.("filmstripDisplayChanged", (event?: unknown) => {
              const visible = filmstripVisibleFromEvent(event);
              if (visible !== null) setFilmstripVisible(visible);
            });

            // --- Join/leave toasts -----------------------------------------
            api.addEventListener?.("videoConferenceJoined", (event?: unknown) => {
              const id =
                event && typeof event === "object"
                  ? (event as { id?: unknown }).id
                  : null;
              setLocalParticipant(
                presenceRef.current,
                typeof id === "string" ? id : null
              );
              // Silence the initial roster burst / reconnect settle, then start
              // announcing genuinely new joins and leaves.
              announceRef.current = false;
              if (announceTimeoutRef.current) {
                window.clearTimeout(announceTimeoutRef.current);
              }
              announceTimeoutRef.current = window.setTimeout(() => {
                announceRef.current = true;
              }, PRESENCE_SETTLE_MS);
            });
            api.addEventListener?.("participantJoined", (event?: unknown) => {
              const p = parseParticipantJoined(event);
              if (!p) return;
              const message = handleJoin(presenceRef.current, p.id, p.displayName);
              if (message && announceRef.current) {
                toast(message, { duration: PRESENCE_TOAST_MS });
              }
            });
            api.addEventListener?.("participantLeft", (event?: unknown) => {
              const p = parseParticipantLeft(event);
              if (!p) return;
              const message = handleLeave(presenceRef.current, p.id);
              if (message && announceRef.current) {
                toast(message, { duration: PRESENCE_TOAST_MS });
              }
            });

            api.addEventListener?.("connectionInterrupted", () => {
              setConnectionStatus("interrupted");
              announceRef.current = false; // no join/leave toasts during a blip
              reconnectTimeoutRef.current = window.setTimeout(() => {
                setJitsiKey((k) => k + 1);
              }, RECONNECT_ATTEMPT_DELAY_MS);
            });
            api.addEventListener?.("connectionRestored", () => {
              setConnectionStatus("connected");
              if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
              }
            });
          }}
          onReadyToClose={() => router.back()}
          getIFrameRef={(iframeRef: HTMLElement) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }}
          />
        </div>
        {booking && questionSession.panelOpen && (
          <LessonQuestionPanel
            booking={booking}
            session={questionSession}
            onClose={questionSession.closePanel}
          />
        )}
        {booking && isTutor && notesPanelOpen && (
          <aside className="absolute inset-y-3 right-3 z-20 w-[min(24rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl border bg-background p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-sm font-medium">{booking.student.display_name || booking.student.email}</p>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setNotesPanelOpen(false)} aria-label="Not panelini kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TutorStudentPrivateWorkspace studentId={booking.student.id} compact />
          </aside>
        )}
      </div>

      <VideoQualityDialog
        open={qualityDialogOpen}
        onOpenChange={setQualityDialogOpen}
        selectedLevel={selectedQuality}
        isApplying={pendingQuality !== null}
        hasError={qualityError}
        roomReady={Boolean(jitsiApi) && capabilities.videoQuality}
        onSelectLevel={applyQuality}
        triggerRef={qualityButtonRef}
      />

      <LeaveConfirmDialog
        open={leaveDialogOpen}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        isLeaving={isLeaving}
        returnFocusRef={leaveButtonRef}
      />

      {isStudent && (
        <EarlyEndRequestDialog
          open={isEndPending}
          onAccept={handleAcceptEnd}
          onContinue={handleContinueEnd}
          isSubmitting={session.respond.isPending}
          hasError={session.respond.isError}
          returnFocusRef={questionButtonRef}
        />
      )}

      <LessonQuestionInvitationDialog
        open={questionSession.invitationOpen && !isEndPending}
        question={questionSession.state?.active_question ?? null}
        returnFocusRef={questionButtonRef}
        onAccept={questionSession.acceptInvitation}
        onDismiss={questionSession.dismissInvitation}
      />
    </div>
  );
}

export default function SessionPage() {
  return (
    <RouteGuard requireAuth>
      <SessionContent />
    </RouteGuard>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, FileQuestion, PenSquare, StickyNote, Video, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  fetchBookings,
  fetchSessionToken,
  requestEarlyEnd,
  sendBookingHeartbeat,
} from "@/lib/lessonsApi";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import type { Booking } from "@/types";
import { LessonQuestionPanel } from "@/components/questions/LessonQuestionPanel";
import { TutorStudentNotes } from "@/components/tutors/TutorStudentNotes";

const EARLY_JOIN_MINUTES = 15;
const HEARTBEAT_INTERVAL_MS = 60_000;
const LOW_TIME_WARNING_MS = 5 * 60_000;
const RECONNECT_ATTEMPT_DELAY_MS = 12_000;
const ENDED_STATUSES = new Set([
  "awaiting_confirmation",
  "completed",
  "disputed",
  "cancelled",
]);

type JitsiApi = {
  executeCommand?: (name: string, ...args: unknown[]) => void;
  addEventListener?: (event: string, handler: (...args: unknown[]) => void) => void;
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
          <Clock3 className="h-4 w-4" />
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
            <ArrowLeft className="mr-2 h-4 w-4" />
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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tutorProfileQuery = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: user?.role === "tutor",
    retry: false,
  });

  useEffect(() => {
    if (user?.role === "tutor" && tutorProfileQuery.data && !tutorProfileQuery.data.is_verified) {
      router.replace("/tutor/onboarding");
    }
  }, [router, tutorProfileQuery.data, user?.role]);
  const [now, setNow] = useState(() => Date.now());
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "interrupted"
  >("connected");
  const [jitsiKey, setJitsiKey] = useState(0);
  const [isRequestingEnd, setIsRequestingEnd] = useState(false);
  const [questionPanelOpen, setQuestionPanelOpen] = useState(true);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const participantNamesRef = useRef<Map<string, string>>(new Map());

  const { data: bookings, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    refetchInterval: (query) => {
      const current = query.state.data?.find((b) => b.id === bookingId);
      return current?.status === "in_progress" ? 4_000 : false;
    },
  });

  const booking = bookings?.find((b) => b.id === bookingId);

  const earlyEndRequestedByMe = booking
    ? user?.role === "tutor"
      ? Boolean(booking.tutor_end_requested_at)
      : Boolean(booking.student_end_requested_at)
    : false;

  const handleRequestEarlyEnd = async () => {
    if (!booking) return;
    setIsRequestingEnd(true);
    try {
      const updated = await requestEarlyEnd(booking.id);
      queryClient.setQueryData<Booking[]>(["bookings"], (old) =>
        old ? old.map((b) => (b.id === updated.id ? updated : b)) : old
      );
      if (updated.status === "awaiting_confirmation") {
        toast.success("Ders sona erdi. Onay bekleniyor.");
      } else {
        toast.info("İstek gönderildi. Karşı tarafın onayı bekleniyor.");
      }
    } catch {
      toast.error("İstek gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setIsRequestingEnd(false);
    }
  };

  // Notifies the counterpart when the other side requests an early end, so
  // they don't have to notice the "Dersi bitir" button state changing on its own.
  const counterpartEndRequestedAtRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!booking || !user?.role) return;
    const counterpartRequestedAt =
      user.role === "tutor" ? booking.student_end_requested_at : booking.tutor_end_requested_at;
    const previous = counterpartEndRequestedAtRef.current;
    if (previous === undefined) {
      counterpartEndRequestedAtRef.current = counterpartRequestedAt ?? null;
      return;
    }
    if (!previous && counterpartRequestedAt) {
      const label = user.role === "tutor" ? "Öğrenci" : "Hocan";
      toast(`${label} dersi bitirmek istiyor. Onaylıyor musun?`, {
        action: {
          label: "Onayla",
          onClick: () => handleRequestEarlyEnd(),
        },
      });
    }
    counterpartEndRequestedAtRef.current = counterpartRequestedAt ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.student_end_requested_at, booking?.tutor_end_requested_at, user?.role]);
  const studentTooEarly = useMemo(() => {
    if (!booking || user?.role !== "student") return false;
    const status = (booking.status || "").toLowerCase();
    if (status !== "confirmed") return false;
    const joinAt =
      new Date(booking.start_time).getTime() - EARLY_JOIN_MINUTES * 60 * 1000;
    return now < joinAt;
  }, [booking, now, user?.role]);
  const lessonWindowEnded = Boolean(
    booking && now >= scheduledEndTime(booking)
  );

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

  const sessionEnded = Boolean(
    booking && (ENDED_STATUSES.has(booking.status) || lessonWindowEnded)
  );
  const inSession =
    Boolean(booking) &&
    !studentTooEarly &&
    Boolean(sessionToken) &&
    !sessionEnded;

  // Ticks once a second while a countdown is on screen (waiting room handles
  // its own timer; this drives the in-session "kalan süre" bar).
  useEffect(() => {
    if (!inSession) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [inSession]);

  // Attendance heartbeat: fires immediately on join, then every 60s. Paused
  // while the tab is hidden and resumed (with an immediate ping) on return.
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

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [inSession, bookingId]);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
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
          router.push(user?.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student")
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

  const displayName = booking
    ? user?.role === "tutor"
      ? `${booking.tutor.name} ${booking.tutor.surname}`.trim()
      : booking.student.display_name || booking.student.email
    : (user?.email?.split("@", 1)[0] ?? "Kullanıcı");

  const handleWhiteboardOpen = () => {
    if (!jitsiApi?.executeCommand) {
      toast.info("Ders odası hazırlanıyor. Birkaç saniye sonra tekrar dene.");
      return;
    }

    try {
      jitsiApi.executeCommand("toggleWhiteboard");
      toast.info(
        "Whiteboard açıldı. Sağ üstteki menüden PNG/SVG olarak dışa aktarabilirsin."
      );
    } catch {
      toast.error("Whiteboard şu anda açılamadı.");
    }
  };

  const handleConfirmLeave = () => {
    setLeaveConfirmOpen(false);
    try {
      jitsiApi?.executeCommand?.("hangup");
    } catch {
      // Meeting may already be closed — nothing to clean up.
    }
    router.back();
  };

  const remainingMs = booking ? scheduledEndTime(booking) - now : null;
  const isOvertime = remainingMs !== null && remainingMs <= 0;
  const isLowTime =
    remainingMs !== null && remainingMs > 0 && remainingMs <= LOW_TIME_WARNING_MS;

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
          {remainingMs !== null && (
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-1 text-xs tabular-nums ${
                isOvertime
                  ? "border-red-500/50 bg-red-500/20 text-red-200"
                  : isLowTime
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-200"
                    : "border-white/20 bg-white/5 text-slate-200"
              }`}
            >
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {isOvertime ? "Süre doldu" : formatCountdown(remainingMs)}
            </span>
          )}
          <button
            onClick={() => setQuestionPanelOpen((open) => !open)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            Canlı soru
          </button>
          {user?.role === "tutor" && booking && (
            <button
              onClick={() => setNotesPanelOpen((open) => !open)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
              aria-expanded={notesPanelOpen}
            >
              <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
              Öğrenci notları
            </button>
          )}
          <button
            onClick={handleWhiteboardOpen}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            <PenSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Whiteboard&apos;ı aç
          </button>
          <button
            onClick={handleRequestEarlyEnd}
            disabled={isRequestingEnd || earlyEndRequestedByMe}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {earlyEndRequestedByMe ? "Onay bekleniyor..." : "Dersi bitir"}
          </button>
          <button
            onClick={() => setLeaveConfirmOpen(true)}
            className="shrink-0 rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            Çıkış
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
          userInfo={{
            displayName,
            email: user?.email ?? "",
          }}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            disableAddingBackgroundImages: false,
            toolbarButtons: [
              "microphone",
              "camera",
              "chat",
              "whiteboard",
              "tileview",
            ],
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: "#111827",
            CONNECTION_INDICATOR_DISABLED: true,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "chat",
              "whiteboard",
              "tileview",
            ],
          }}
          onApiReady={(api) => {
            setJitsiApi(api);
            setConnectionStatus("connected");
            api.addEventListener?.("connectionInterrupted", () => {
              setConnectionStatus("interrupted");
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
            // The SDK's addEventListener type declares handlers as `() => void`,
            // but Jitsi actually invokes participant events with a payload.
            api.addEventListener?.(
              "participantJoined",
              ((event: { id?: string; displayName?: string }) => {
                if (event?.id && event?.displayName) {
                  participantNamesRef.current.set(event.id, event.displayName);
                }
                if (event?.displayName) toast.info(`${event.displayName} derse katıldı`);
              }) as unknown as () => void
            );
            api.addEventListener?.(
              "participantLeft",
              ((event: { id?: string; displayName?: string }) => {
                const name =
                  event?.displayName ||
                  (event?.id ? participantNamesRef.current.get(event.id) : undefined);
                if (name) toast.info(`${name} dersten ayrıldı`);
                if (event?.id) participantNamesRef.current.delete(event.id);
              }) as unknown as () => void
            );
          }}
          onReadyToClose={() => router.back()}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }}
          />
        </div>
        {booking && questionPanelOpen && (
          <LessonQuestionPanel
            booking={booking}
            onClose={() => setQuestionPanelOpen(false)}
          />
        )}
        {booking && user?.role === "tutor" && notesPanelOpen && (
          <aside className="absolute inset-y-3 right-3 z-20 w-[min(24rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl border bg-background p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-sm font-medium">{booking.student.display_name || booking.student.email}</p>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setNotesPanelOpen(false)} aria-label="Not panelini kapat">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <TutorStudentNotes studentId={booking.student.id} compact />
          </aside>
        )}
      </div>
      <Dialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dersten ayrıl</DialogTitle>
            <DialogDescription>
              Dersten ayrılmak istediğine emin misin?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveConfirmOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleConfirmLeave}>
              Dersten Ayrıl
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

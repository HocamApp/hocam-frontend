"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, Download, FileQuestion, Video, WifiOff } from "lucide-react";
import { toast } from "sonner";
import {
  fetchBookings,
  fetchSessionToken,
  requestEarlyEnd,
  sendBookingHeartbeat,
} from "@/lib/lessonsApi";
import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Booking } from "@/types";
import { LessonQuestionPanel } from "@/components/questions/LessonQuestionPanel";

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
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950 text-white">
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
  const [now, setNow] = useState(() => Date.now());
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "interrupted"
  >("connected");
  const [jitsiKey, setJitsiKey] = useState(0);
  const [isRequestingEnd, setIsRequestingEnd] = useState(false);
  const [questionPanelOpen, setQuestionPanelOpen] = useState(true);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const { data: bookings, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
    refetchInterval: (query) => {
      const current = query.state.data?.find((b) => b.id === bookingId);
      return current?.status === "in_progress" ? 10_000 : false;
    },
  });

  const booking = bookings?.find((b) => b.id === bookingId);
  const studentTooEarly = useMemo(() => {
    if (!booking || user?.role !== "student") return false;
    const status = (booking.status || "").toLowerCase();
    if (status !== "confirmed") return false;
    const joinAt =
      new Date(booking.start_time).getTime() - EARLY_JOIN_MINUTES * 60 * 1000;
    return now < joinAt;
  }, [booking, now, user?.role]);

  const {
    data: sessionToken,
    isLoading: isLoadingToken,
    isError: isTokenError,
  } = useQuery({
    queryKey: ["session-token", bookingId],
    queryFn: () => fetchSessionToken(bookingId),
    retry: false,
    enabled: Boolean(bookingId) && Boolean(booking) && !studentTooEarly,
  });

  const sessionEnded = Boolean(booking && ENDED_STATUSES.has(booking.status));
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

  const displayName = user?.email?.split("@", 1)[0] ?? "Kullanıcı";

  const handleWhiteboardDownload = () => {
    if (!jitsiApi?.executeCommand) {
      toast.info("Ders odası hazırlanıyor. Birkaç saniye sonra tekrar dene.");
      return;
    }

    try {
      jitsiApi.executeCommand("toggleWhiteboard");
      toast.info(
        "Whiteboard açıldı. Beyaz tahta menüsünden dışa aktar/indir seçeneğini kullanabilirsin."
      );
    } catch {
      toast.error("Whiteboard şu anda açılamadı.");
    }
  };

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

      <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-900 px-4 py-2 text-sm text-white">
        <span className="min-w-0 truncate font-medium">
          {booking ? `${booking.subject.name} — Canlı Ders` : "Canlı Ders"}
        </span>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {remainingMs !== null && (
            <span
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs tabular-nums ${
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
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            Canlı soru
          </button>
          <button
            onClick={handleWhiteboardDownload}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Whiteboard indir
          </button>
          <button
            onClick={handleRequestEarlyEnd}
            disabled={isRequestingEnd || earlyEndRequestedByMe}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {earlyEndRequestedByMe ? "Onay bekleniyor..." : "Dersi bitir"}
          </button>
          <button
            onClick={() => router.back()}
            className="rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
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
              "hangup",
            ],
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: "#111827",
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "chat",
              "whiteboard",
              "tileview",
              "hangup",
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
      </div>
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

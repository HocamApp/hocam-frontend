"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock3, Download, Video } from "lucide-react";
import { toast } from "sonner";
import { fetchBookings, fetchSessionToken } from "@/lib/lessonsApi";
import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Booking } from "@/types";

const EARLY_JOIN_MINUTES = 15;
type JitsiApi = {
  executeCommand?: (name: string, ...args: unknown[]) => void;
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

function SessionContent() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);

  const { data: bookings, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
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

  useEffect(() => {
    if (!studentTooEarly) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [studentTooEarly]);

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

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-2 text-sm text-white">
        <span className="min-w-0 truncate font-medium">
          {booking ? `${booking.subject.name} — Canlı Ders` : "Canlı Ders"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleWhiteboardDownload}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Whiteboard indir
          </button>
          <button
            onClick={() => router.back()}
            className="rounded border border-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/10"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="flex-1">
        <JitsiMeeting
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
          onApiReady={(api) => setJitsiApi(api)}
          onReadyToClose={() => router.back()}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }}
        />
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

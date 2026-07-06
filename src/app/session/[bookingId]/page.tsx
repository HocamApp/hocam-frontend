"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchBookings, fetchSessionToken } from "@/lib/lessonsApi";
import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false }
);

function SessionContent() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: bookings, isLoading: isLoadingBooking } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookings,
  });

  const {
    data: sessionToken,
    isLoading: isLoadingToken,
    isError: isTokenError,
  } = useQuery({
    queryKey: ["session-token", bookingId],
    queryFn: () => fetchSessionToken(bookingId),
    retry: false,
  });

  const booking = bookings?.find((b) => b.id === bookingId);

  if (isLoadingBooking || isLoadingToken) {
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

  const displayName = user?.email ?? "Kullanıcı";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 text-sm text-white">
        <span className="font-medium">
          {booking
            ? `${booking.subject.name} — Canlı Ders`
            : "Canlı Ders"}
        </span>
        <button
          onClick={() => router.back()}
          className="rounded border border-white/20 px-3 py-1 text-xs hover:bg-white/10 transition-colors"
        >
          Çıkış
        </button>
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

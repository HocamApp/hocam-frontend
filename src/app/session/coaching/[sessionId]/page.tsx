"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { WifiOff, FileText } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { CoachingIncidentActions } from "@/components/coaching/CoachingIncidentActions";
import { CoachingReportWizard } from "@/components/coaching/CoachingReportWizard";
import {
  getCoachingJitsiConfigOverwrite,
  COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE,
  useJaasReconnect,
} from "@/lib/jaasEmbed";
import {
  fetchCoachingSessionDetail,
  fetchCoachingSessionToken,
  COACHING_SESSION_QUERY_KEYS,
  extractCoachingErrorMessage,
  extractCoachingErrorCode,
} from "@/lib/coachingApi";

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false }
);

function CoachingRoomPanel({
  sessionId,
  viewerRole,
}: {
  sessionId: string;
  viewerRole: "student" | "tutor";
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const { data: detail } = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="text-sm font-medium">
          {viewerRole === "tutor" ? detail?.student_name : detail?.tutor_name}
        </p>
        {detail && (
          <p className="text-xs text-muted-foreground">
            {formatDate(detail.scheduled_start)} · {detail.scheduled_local_time.slice(0, 5)}
          </p>
        )}
        {detail && (
          <p className="mt-1 text-xs text-muted-foreground">Durum: {detail.status}</p>
        )}
      </div>

      <CoachingAttachmentPanel sessionId={sessionId} />

      {viewerRole === "tutor" && detail?.status === "in_progress" && (
        <div className="space-y-2 border-t pt-3">
          <Button
            size="sm"
            variant={reportOpen ? "secondary" : "outline"}
            className="w-full justify-start"
            onClick={() => setReportOpen((current) => !current)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {reportOpen ? "Rapor taslağını gizle" : "Rapor taslağını görüşme sırasında doldur"}
          </Button>
          {reportOpen && (
            <div className="rounded-md border p-3">
              <CoachingReportWizard sessionId={sessionId} />
            </div>
          )}
        </div>
      )}

      <div className="border-t pt-3">
        <CoachingIncidentActions sessionId={sessionId} viewerRole={viewerRole} />
      </div>
    </div>
  );
}

function CoachingSessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const viewerRole = user?.role === "tutor" ? "tutor" : "student";
  const { embedKey, connectionStatus, onConnectionInterrupted, onConnectionRestored } =
    useJaasReconnect();

  const {
    data: sessionToken,
    isLoading: isLoadingToken,
    isError: isTokenError,
    error: tokenError,
  } = useQuery({
    queryKey: ["coaching-session-token", sessionId],
    queryFn: () => fetchCoachingSessionToken(sessionId),
    retry: false,
    enabled: Boolean(sessionId),
    refetchInterval: (query) => (query.state.status === "error" ? 30_000 : false),
  });

  // The panel (attachments, no-show/technical-issue reporting) is
  // reachable regardless of whether the video token succeeds — a session
  // that has already ended is exactly when no-show reporting matters most
  // (Faz 5 Final Revision §4), so it must never be gated behind a
  // successful join.
  let videoArea: React.ReactNode;
  if (isLoadingToken) {
    videoArea = (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  } else if (isTokenError || !sessionToken) {
    const code = extractCoachingErrorCode(tokenError);
    const message =
      code === "too_early"
        ? "Görüşme odası henüz açılmadı. Başlama saatine yaklaştığında tekrar dene."
        : code === "session_ended"
        ? "Bu görüşme sona erdi."
        : extractCoachingErrorMessage(tokenError);
    videoArea = (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <ErrorMessage message={message} />
        <Button variant="outline" onClick={() => router.push(`/dashboard/${viewerRole}`)}>
          Panelime dön
        </Button>
      </div>
    );
  } else {
    videoArea = (
      <JitsiMeeting
        key={embedKey}
        domain={sessionToken.domain}
        roomName={sessionToken.room}
        jwt={sessionToken.token}
        lang="tr"
        userInfo={{ displayName: user?.email ?? "Kullanıcı", email: user?.email ?? "" }}
        configOverwrite={getCoachingJitsiConfigOverwrite()}
        interfaceConfigOverwrite={COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE}
        onApiReady={(api: { addEventListener?: (event: string, handler: (...args: unknown[]) => void) => void }) => {
          api.addEventListener?.("connectionInterrupted", onConnectionInterrupted);
          api.addEventListener?.("connectionRestored", onConnectionRestored);
        }}
        onReadyToClose={() =>
          router.push(
            viewerRole === "student"
              ? `/session/coaching/${sessionId}/summary`
              : `/dashboard/${viewerRole}`
          )
        }
        getIFrameRef={(iframeRef: HTMLElement) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
        }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {connectionStatus === "interrupted" && (
        <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-1.5 text-center text-xs font-medium text-white">
          <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          Bağlantı koptu. Yeniden bağlanmaya çalışılıyor...
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-[50vh] min-w-0 flex-1 md:min-h-0 md:basis-[65%]">
          {videoArea}
        </div>
        <div className="min-h-0 border-t bg-background md:basis-[35%] md:border-l md:border-t-0">
          <CoachingRoomPanel sessionId={sessionId} viewerRole={viewerRole} />
        </div>
      </div>
    </div>
  );
}

export default function CoachingSessionPage() {
  return (
    <RouteGuard requireAuth>
      <CoachingSessionContent />
    </RouteGuard>
  );
}

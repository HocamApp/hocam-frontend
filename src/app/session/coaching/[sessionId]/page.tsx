"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import {
  NO_SHOW_CONSUMED_COPY,
  NO_SHOW_PARTY_LABEL,
  NO_SHOW_RIGHT_PRESERVED_COPY,
} from "@/lib/coachingSessionCopy";
import {
  getCoachingJitsiConfigOverwrite,
  COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE,
  useJaasReconnect,
} from "@/lib/jaasEmbed";
import {
  fetchCoachingSessionDetail,
  fetchCoachingSessionToken,
  reportCoachingSessionNoShow,
  reportCoachingSessionTechnicalIssue,
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
  const queryClient = useQueryClient();
  const [incidentNote, setIncidentNote] = useState("");
  const { data: detail } = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });

  const invalidateTerminalIncident = () => {
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId) });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.studentList() });
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.tutorList() });
    // This active query refetches and moves the room out of its stale joinable UI.
    queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.token(sessionId) });
  };

  const noShowMutation = useMutation({
    mutationFn: (party: "student" | "tutor") => reportCoachingSessionNoShow(sessionId, party, incidentNote),
    onSuccess: () => {
      toast.success("Bildirim kaydedildi.");
      setIncidentNote("");
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const technicalIssueMutation = useMutation({
    mutationFn: () => reportCoachingSessionTechnicalIssue(sessionId, incidentNote),
    onSuccess: () => {
      toast.success("Teknik sorun bildirildi.");
      setIncidentNote("");
      invalidateTerminalIncident();
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const otherParty = viewerRole === "tutor" ? "student" : "tutor";
  const otherPartyLabel = NO_SHOW_PARTY_LABEL[otherParty];

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

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-medium">Bir sorun mu var?</p>
        <Textarea
          className="min-h-20"
          value={incidentNote}
          onChange={(event) => setIncidentNote(event.target.value)}
          placeholder="Kısa incident notu (opsiyonel)"
          aria-label="Incident notu"
        />
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={noShowMutation.isPending}
          onClick={() => noShowMutation.mutate(otherParty)}
        >
          {otherPartyLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={technicalIssueMutation.isPending}
          onClick={() => technicalIssueMutation.mutate()}
        >
          Teknik sorun bildir
        </Button>
        {viewerRole === "tutor" && (
          <p className="text-xs text-muted-foreground">{NO_SHOW_CONSUMED_COPY}</p>
        )}
        {viewerRole === "student" && (
          <p className="text-xs text-muted-foreground">{NO_SHOW_RIGHT_PRESERVED_COPY}</p>
        )}
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
        onReadyToClose={() => router.push(`/dashboard/${viewerRole}`)}
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

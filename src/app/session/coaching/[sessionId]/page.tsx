"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Folder, Lifebuoy, NotePencil } from "@phosphor-icons/react";

import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { CoachingReportQuickDraft } from "@/components/coaching/CoachingReportQuickDraft";
import { PostSessionProblems } from "@/components/coaching/PostSessionParts";
import {
  RoomBottomBar,
  RoomConnectionStrip,
  RoomPanel,
  RoomPanelSection,
  RoomStateCard,
  RoomTopBar,
  useRoomOpenTimer,
  type RoomPanelView,
} from "@/components/coaching/RoomParts";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useServerNow } from "@/hooks/useServerNow";
import {
  COACHING_SESSION_QUERY_KEYS,
  extractCoachingErrorCode,
  fetchCoachingSessionAttendanceSummary,
  fetchCoachingSessionDetail,
  fetchCoachingSessionToken,
  fetchCoachingSessions,
  fetchTutorCoachingSessions,
} from "@/lib/coachingApi";
import {
  counterpartPresence,
  noShowOption,
  postSessionCanReport,
  postSessionNumber,
  type PostSessionRole,
} from "@/lib/coachingPostSession";
import { coachingRoomUserInfo } from "@/lib/coachingPresentation";
import { roomClock, roomFailure, roomMeta } from "@/lib/coachingRoom";
import {
  getCoachingJitsiConfigOverwrite,
  COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE,
  useJaasReconnect,
} from "@/lib/jaasEmbed";

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false }
);

/**
 * The coaching video room's frame: a dark bar (whose meeting, how much is left),
 * the call, and a panel (files, the tutor's report draft, the problem row) that a
 * desktop opens beside the call and a phone opens under it. The call itself is
 * Jitsi's and none of its settings are touched. There is deliberately no "leave"
 * control: what an early exit means for the right to a meeting, the tutor's
 * earnings and refunds is not decided in the backend yet, so a button that makes
 * it a deliberate act is not a frame decision.
 */
function CoachingSessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const role: PostSessionRole = user?.role === "tutor" ? "tutor" : "student";
  const now = useServerNow(15_000);
  const { embedKey, connectionStatus, onConnectionInterrupted, onConnectionRestored } =
    useJaasReconnect();
  const [panelOpen, setPanelOpen] = useState(true);
  const [phoneView, setPhoneView] = useState<RoomPanelView | null>(null);

  // Wait for the detail before mounting the call: Jitsi reads userInfo once,
  // so mounting early would fix the name to the role fallback.
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
    enabled: Boolean(sessionId),
  });

  const tokenQuery = useQuery({
    queryKey: ["coaching-session-token", sessionId],
    queryFn: () => fetchCoachingSessionToken(sessionId),
    retry: false,
    enabled: Boolean(sessionId),
    refetchInterval: (query) => (query.state.status === "error" ? 30_000 : false),
  });
  const { data: sessionToken, isLoading: isLoadingToken, isError: isTokenError, error: tokenError } = tokenQuery;

  // For the meeting's number on the bar.
  const sessionsQuery = useQuery({
    queryKey: role === "tutor" ? COACHING_SESSION_QUERY_KEYS.tutorList() : COACHING_SESSION_QUERY_KEYS.studentList(),
    queryFn: role === "tutor" ? fetchTutorCoachingSessions : fetchCoachingSessions,
    staleTime: 60_000,
  });
  // Who is in the meeting, read again every minute while a report is still possible.
  const canReport = detail !== undefined && postSessionCanReport(detail);
  const attendanceQuery = useQuery({
    queryKey: ["coaching-session-attendance", sessionId],
    queryFn: () => fetchCoachingSessionAttendanceSummary(sessionId),
    enabled: canReport,
    refetchInterval: 60_000,
  });

  const otherName = role === "tutor" ? detail?.student_name : detail?.tutor_name;
  const summaryHref = `/session/coaching/${sessionId}/summary`;
  const roomRefused = !isLoadingToken && !isLoadingDetail && (isTokenError || !sessionToken);
  const failure = roomRefused
    ? roomFailure({
        code: extractCoachingErrorCode(tokenError),
        status: (tokenError as { response?: { status?: number } } | null)?.response?.status ?? null,
        session: detail,
        role,
        otherName,
        now,
      })
    : null;
  // A room that is not open yet is asked for again the moment it opens.
  useRoomOpenTimer(failure?.kind === "waiting" ? failure.opensAt : null, () => void tokenQuery.refetch());

  // The panel (attachments, no-show/technical-issue reporting) is
  // reachable regardless of whether the video token succeeds — a session
  // that has already ended is exactly when no-show reporting matters most
  // (Faz 5 Final Revision §4), so it must never be gated behind a
  // successful join.
  let videoArea: React.ReactNode;
  if (isLoadingToken || isLoadingDetail) {
    videoArea = (
      <div className="flex flex-1 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  } else if (failure) {
    videoArea = (
      <div className="flex flex-1 items-center justify-center">
        <RoomStateCard
          title={failure.title}
          message={failure.message}
          countdown={failure.kind === "waiting" ? failure.countdown : null}
        >
          {failure.kind === "waiting" && role === "tutor" ? (
            <Button asChild size="sm" variant="gold" className="min-h-11">
              <Link href={`/dashboard/tutor/coaching/sessions/${sessionId}/prepare`}>Görüşmeye hazırlan</Link>
            </Button>
          ) : null}
          {failure.kind === "closed" && failure.summary ? (
            <Button asChild size="sm" variant="gold" className="min-h-11">
              <Link href={summaryHref}>Görüşme özetine git</Link>
            </Button>
          ) : null}
          {failure.kind === "unavailable" ? (
            <Button
              type="button"
              size="sm"
              variant="gold"
              className="min-h-11"
              disabled={tokenQuery.isFetching}
              onClick={() => void tokenQuery.refetch()}
            >
              Tekrar dene
            </Button>
          ) : null}
        </RoomStateCard>
      </div>
    );
  } else if (sessionToken) {
    videoArea = (
      <JitsiMeeting
        key={embedKey}
        domain={sessionToken.domain}
        roomName={sessionToken.room}
        jwt={sessionToken.token}
        lang="tr"
        userInfo={coachingRoomUserInfo(detail, role)}
        configOverwrite={getCoachingJitsiConfigOverwrite()}
        interfaceConfigOverwrite={COACHING_JITSI_INTERFACE_CONFIG_OVERWRITE}
        onApiReady={(api: { addEventListener?: (event: string, handler: (...args: unknown[]) => void) => void }) => {
          api.addEventListener?.("connectionInterrupted", onConnectionInterrupted);
          api.addEventListener?.("connectionRestored", onConnectionRestored);
        }}
        // Both sides land on the screen after the meeting: the student's options,
        // the tutor's report and next meeting.
        onReadyToClose={() => router.push(summaryHref)}
        getIFrameRef={(iframeRef: HTMLElement) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
        }}
      />
    );
  }

  // A failed attendance read must not hide a report that is real: fail open.
  const presence = attendanceQuery.isError ? "absent" : counterpartPresence(attendanceQuery.data, role);
  const noShow = detail ? noShowOption({ session: detail, presence, now }) : ({ kind: "hidden" } as const);
  const showDraft = role === "tutor" && detail?.status === "in_progress";
  const barItems = [
    { key: "dosyalar" as const, label: "Dosyalar", icon: <Folder className="h-5 w-5" aria-hidden="true" /> },
    ...(showDraft
      ? [{ key: "rapor" as const, label: "Rapor", icon: <NotePencil className="h-5 w-5" aria-hidden="true" /> }]
      : []),
    ...(canReport
      ? [{ key: "sorun" as const, label: "Sorun", icon: <Lifebuoy className="h-5 w-5" aria-hidden="true" /> }]
      : []),
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RoomTopBar
        title={otherName?.trim() || "Görüşme"}
        meta={detail ? roomMeta(detail, postSessionNumber({ session: detail, role, sessions: sessionsQuery.data ?? [] })) : ""}
        clock={detail ? roomClock(detail, now) : null}
        summaryHref={failure || isLoadingToken || isLoadingDetail ? null : summaryHref}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((open) => !open)}
      />
      {connectionStatus === "interrupted" && <RoomConnectionStrip />}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-[46vh] min-w-0 flex-1 bg-ink md:min-h-0 md:basis-[65%]">{videoArea}</div>
        <RoomPanel view={phoneView} desktopOpen={panelOpen}>
          <RoomPanelSection id="dosyalar" view={phoneView}>
            <CoachingAttachmentPanel sessionId={sessionId} viewerRole={role} otherName={otherName} heading="Dosyalar" />
          </RoomPanelSection>
          {showDraft ? (
            <RoomPanelSection id="rapor" view={phoneView}>
              <h2 className="mb-3 text-body font-medium text-ink">Rapor taslağı</h2>
              <CoachingReportQuickDraft sessionId={sessionId} />
            </RoomPanelSection>
          ) : null}
          {canReport ? (
            <RoomPanelSection id="sorun" view={phoneView}>
              <PostSessionProblems sessionId={sessionId} role={role} noShow={noShow} title="Bir sorun mu var?" flush />
            </RoomPanelSection>
          ) : null}
        </RoomPanel>
      </div>
      <RoomBottomBar
        items={barItems}
        active={phoneView}
        onSelect={(key) => setPhoneView((current) => (current === key ? null : key))}
      />
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

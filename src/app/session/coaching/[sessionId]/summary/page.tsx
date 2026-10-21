"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import {
  PostSessionBand,
  PostSessionGoldLink,
  PostSessionInkLink,
  PostSessionProblems,
  PostSessionRatingRow,
  PostSessionRow,
} from "@/components/coaching/PostSessionParts";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { useAuth } from "@/hooks/useAuth";
import { useServerNow } from "@/hooks/useServerNow";
import {
  COACHING_SESSION_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingSessionAttendanceSummary,
  fetchCoachingSessionDetail,
  fetchCoachingSessions,
  fetchTutorCoachingSessions,
} from "@/lib/coachingApi";
import {
  postSessionBand,
  postSessionCanReport,
  postSessionMeta,
  postSessionNext,
  postSessionRating,
  tutorNoShowOption,
  tutorPresence,
  type PostSessionRole,
} from "@/lib/coachingPostSession";
import { coachingTutorJoin } from "@/lib/coachingSessions";
import { numberStudentSessions, studentCoachingJoin } from "@/lib/coachingStudentOverview";

/**
 * The screen after a coaching meeting, for either side. A pink band says what
 * became of this meeting (Master Spec §24's promise of the report, with the
 * server's own deadline, when it was held) and one white card holds the options.
 * For the student, §24 names exactly five: Görüşmeyi değerlendir, Teknik sorun
 * bildir, Öğretmen katılmadı bildir (only when the tutor's absence is on record),
 * Sonraki görüşmeyi görüntüle, Koçluk desteğine git. The tutor gets the report
 * and the next meeting. Reached from the room (both sides) and, later, from the
 * student's Görüşmeler list to rate or to report.
 */
function PostSessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const role: PostSessionRole = user?.role === "tutor" ? "tutor" : "student";
  const now = useServerNow();

  const detailQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });
  const detail = detailQuery.data;
  const sessionsQuery = useQuery({
    queryKey: role === "tutor" ? COACHING_SESSION_QUERY_KEYS.tutorList() : COACHING_SESSION_QUERY_KEYS.studentList(),
    queryFn: role === "tutor" ? fetchTutorCoachingSessions : fetchCoachingSessions,
    staleTime: 60_000,
  });
  // Only a student reads the tutor's attendance, and only while a report is still possible.
  const attendanceQuery = useQuery({
    queryKey: ["coaching-session-attendance", sessionId],
    queryFn: () => fetchCoachingSessionAttendanceSummary(sessionId),
    enabled: role === "student" && detail !== undefined && postSessionCanReport(detail),
  });

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (detailQuery.isError || !detail) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <CoachingLoadError
          message={extractCoachingErrorMessage(detailQuery.error)}
          onRetry={() => detailQuery.refetch()}
          isRetrying={detailQuery.isFetching}
        />
      </div>
    );
  }

  const sessions = sessionsQuery.data ?? [];
  // A student's meetings are numbered across the whole plan, as on the Görüşmeler page;
  // until that list is read the number is left out rather than guessed.
  const number =
    role === "tutor"
      ? detail.sequence_number
      : numberStudentSessions(sessions).find(({ session }) => session.id === detail.id)?.number ?? null;
  const band = postSessionBand({ session: detail, role, otherName: role === "tutor" ? detail.student_name : detail.tutor_name });
  const join = role === "tutor" ? coachingTutorJoin(detail, now) : studentCoachingJoin(detail, now);
  const roomHref = join && "href" in join ? join.href : null;
  const next = postSessionNext({ sessions, currentId: detail.id, role, now });
  const nextCaption = sessionsQuery.isLoading ? "Yükleniyor…" : sessionsQuery.isError ? "Görüşmeler yüklenemedi." : next.caption;
  // A failed attendance read must not hide a report that is real: fail open.
  const presence = attendanceQuery.isError ? "absent" : tutorPresence(attendanceQuery.data);
  const rating = postSessionRating(detail, role);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8">
      <PostSessionBand
        title={band.title}
        message={band.message}
        meta={postSessionMeta(detail, number)}
        deadline={band.deadline}
        action={
          roomHref ? (
            <PostSessionInkLink href={roomHref}>
              {detail.status === "in_progress" ? "Odaya geri dön" : "Odaya git"}
            </PostSessionInkLink>
          ) : undefined
        }
      />

      <section aria-label="Görüşme sonrası" className="overflow-hidden rounded-card border border-line bg-surface">
        {role === "student" ? (
          <>
            {rating !== "hidden" ? <PostSessionRatingRow sessionId={detail.id} state={rating} /> : null}
            <PostSessionRow title="Sonraki görüşmeyi görüntüle" caption={nextCaption}>
              <PostSessionGoldLink href="/dashboard/student/coaching/upcoming">Görüntüle</PostSessionGoldLink>
            </PostSessionRow>
            {postSessionCanReport(detail) ? (
              <PostSessionProblems sessionId={detail.id} noShow={tutorNoShowOption({ session: detail, presence, now })} />
            ) : null}
            <PostSessionRow title="Koçluk desteğine git" caption="Sorun bildirimlerin ve yeni bildirim">
              <PostSessionGoldLink href="/dashboard/student/coaching/complaints">Git</PostSessionGoldLink>
            </PostSessionRow>
          </>
        ) : (
          <>
            {detail.status === "awaiting_report" ? (
              <PostSessionRow title="Raporu hazırla" caption="Çalışma programı ve ilerleme raporu">
                <PostSessionGoldLink href={`/dashboard/tutor/coaching/sessions/${detail.id}/report`}>Raporu hazırla</PostSessionGoldLink>
              </PostSessionRow>
            ) : null}
            <PostSessionRow title="Sıradaki görüşme" caption={nextCaption}>
              <PostSessionGoldLink href="/dashboard/tutor/coaching/upcoming">Görüşmeler</PostSessionGoldLink>
            </PostSessionRow>
          </>
        )}
      </section>
    </div>
  );
}

export default function CoachingPostSessionPage() {
  return (
    <RouteGuard requireAuth>
      <PostSessionContent />
    </RouteGuard>
  );
}

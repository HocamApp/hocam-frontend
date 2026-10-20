"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { StudentScheduleBoard } from "@/components/coaching/StudentScheduleBoard";
import { coachingServiceStatusLabel, fetchCoachingSchedulingState } from "@/lib/coachingApi";
import { studentCoachingNextStep } from "@/lib/coachingPresentation";

const SESSIONS_HREF = "/dashboard/student/coaching/upcoming";

/**
 * Saat seçme: the student's first weekly hours. Frequency and the 30-minute
 * length come from the tutor's plan (`CoachingSchedulingState`), never from
 * anything the student can edit, and the deadline is always the server's
 * `slot_selection_deadline_at`. Once the coaching runs, changing the regular
 * hours lives on Görüşmeler; this page only sends the student there.
 */
function ScheduleContent() {
  const {
    data: state,
    isLoading: stateLoading,
    isError: stateFailed,
    isFetching: stateFetching,
    refetch: refetchState,
  } = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });

  if (stateLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (stateFailed) {
    return (
      <CoachingLoadError
        message="Koçluk bilgilerin yüklenemedi. Bağlantını kontrol edip tekrar dene."
        onRetry={() => refetchState()}
        isRetrying={stateFetching}
      />
    );
  }

  if (!state) {
    return (
      <EmptyState
        title="Şu anda planlanacak bir koçluğun yok"
        description="Ders paketi ve çalışma koçluğu talebin öğretmenin tarafından kabul edilip hizmetin aktive olduğunda burada saat seçebilirsin."
        steps={["Birleşik talebin kabul edilir", "Koçluk müsaitliğinden düzenli saat seçersin"]}
      />
    );
  }

  if (state.service_status === "active") {
    return <GoToSessions />;
  }

  // Only a coaching that never got a schedule ended because of the
  // selection deadline. A student cancelling an active coaching passes
  // through the same two statuses but already has a service period.
  const endedBeforeScheduling =
    (state.service_status === "cancellation_pending" || state.service_status === "cancelled") &&
    state.service_period_id === null;

  if (endedBeforeScheduling) {
    return (
      <EmptyState
        title="Saat seçme süresi doldu"
        description="Bu koçluk için ortak bir saat bulunamadı; koçluk iptal edildi. Ders paketin bu durumdan etkilenmedi."
      />
    );
  }

  if (state.service_status !== "accepted_awaiting_schedule") {
    const step = studentCoachingNextStep(state.service_status, undefined);
    return (
      <EmptyState
        title="Şu anda saat seçemezsin"
        description={step.kind === "message" ? step.text : coachingServiceStatusLabel(state.service_status)}
      />
    );
  }

  return <StudentScheduleBoard state={state} />;
}

/** A running coaching has no use for this page: its meetings and regular hours are on Görüşmeler. */
function GoToSessions() {
  const router = useRouter();
  useEffect(() => {
    router.replace(SESSIONS_HREF);
  }, [router]);
  return (
    <div className="flex min-h-[24rem] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default function CoachingSchedulePage() {
  return (
    <RouteGuard requireRole="student">
      <CoachingPageShell
        title="Saat seçme"
        width="default"
        currentHref="/dashboard/student/coaching/schedule"
        audience="student"
      >
        <ScheduleContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}

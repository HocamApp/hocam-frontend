import type {
  AcceptanceRequest,
  CoachingCapacityDetail,
  CoachingPlan,
  CoachingSessionItem,
  CoachingStudentRow,
} from "./coachingApi";

export const COACHING_EXAM_GROUPS = ["YKS", "DGS", "KPSS"] as const;
export type CoachingExamGroup = (typeof COACHING_EXAM_GROUPS)[number];

export function isCoachingExamGroup(value: string): value is CoachingExamGroup {
  return COACHING_EXAM_GROUPS.includes(value as CoachingExamGroup);
}

export function partitionAcceptanceRequests(requests: AcceptanceRequest[]) {
  return {
    coaching: requests.filter((request) => request.includes_coaching),
    lessonOnly: requests.filter((request) => !request.includes_coaching),
  };
}

const UPCOMING_SESSION_STATUSES = new Set(["scheduled", "reschedule_requested", "in_progress"]);

export function deriveCoachingMetrics(input: {
  students: CoachingStudentRow[];
  sessions: CoachingSessionItem[];
  requests: AcceptanceRequest[];
}) {
  return {
    activeStudents: input.students.filter((row) => row.service_status === "active").length,
    upcomingSessions: input.sessions.filter((row) => UPCOMING_SESSION_STATUSES.has(row.status)).length,
    pendingReports: input.sessions.filter((row) => row.status === "awaiting_report").length,
    pendingRequests: input.requests.filter(
      (row) => row.includes_coaching && row.status === "pending"
    ).length,
  };
}

export type CoachingPublicationState = "missing" | "draft" | "published";
export type CoachingIntakeState = "not_applicable" | "open" | "closed";
export type CoachingCapacityState = "unknown" | "missing_availability" | "available" | "full";
export type CoachingPlatformCheckoutState = "enabled" | "platform_paused";
export type CoachingReadinessState =
  | "onboarding"
  | "plan"
  | "availability"
  | "capacity"
  | "publish"
  | "complete";

export interface CoachingNextAction {
  label: string;
  href: string;
}

export interface CoachingDerivedStatus {
  publication: CoachingPublicationState;
  intake: CoachingIntakeState;
  capacity: CoachingCapacityState;
  platformCheckout: CoachingPlatformCheckoutState;
  readiness: CoachingReadinessState;
  platformMessage: string | null;
  nextAction: CoachingNextAction | null;
}

export function deriveCoachingStatus(input: {
  onboardingComplete: boolean;
  plan: CoachingPlan | null;
  capacity: CoachingCapacityDetail | null;
  checkoutEnabled: boolean;
}): CoachingDerivedStatus {
  const publication: CoachingPublicationState = !input.plan
    ? "missing"
    : input.plan.is_published
      ? "published"
      : "draft";
  const intake: CoachingIntakeState = input.plan?.is_published
    ? input.plan.is_accepting_new_students
      ? "open"
      : "closed"
    : "not_applicable";
  const capacity: CoachingCapacityState = !input.capacity
    ? "unknown"
    : input.capacity.weekly_slot_count < 1
      ? "missing_availability"
      : input.capacity.can_accept_new_student
        ? "available"
        : "full";
  const platformCheckout: CoachingPlatformCheckoutState = input.checkoutEnabled
    ? "enabled"
    : "platform_paused";

  let readiness: CoachingReadinessState = "complete";
  let nextAction: CoachingNextAction | null = null;
  if (!input.onboardingComplete) {
    readiness = "onboarding";
    nextAction = { label: "Tanıtıma devam et", href: "/dashboard/tutor/coaching/onboarding" };
  } else if (!input.plan) {
    readiness = "plan";
    nextAction = { label: "Teklifini oluştur", href: "/dashboard/tutor/coaching/plan?step=frequency" };
  } else if (!input.capacity || input.capacity.weekly_slot_count < 1) {
    readiness = "availability";
    nextAction = { label: "Koçluk saatlerini ekle", href: "/dashboard/tutor/coaching/plan?step=availability" };
  } else if (input.capacity.theoretical_capacity < input.plan.max_active_students) {
    readiness = "capacity";
    nextAction = { label: "Kapasiteyi düzenle", href: "/dashboard/tutor/coaching/plan?step=capacity" };
  } else if (!input.plan.is_published) {
    readiness = "publish";
    nextAction = { label: "Teklifini gözden geçir", href: "/dashboard/tutor/coaching/plan?step=publish" };
  }

  return {
    publication,
    intake,
    capacity,
    platformCheckout,
    readiness,
    platformMessage:
      publication === "published" && platformCheckout === "platform_paused"
        ? "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı."
        : null,
    nextAction,
  };
}

const COACHING_SESSION_STATUS_LABELS: Record<string, string> = {
  scheduled: "Planlandı",
  reschedule_requested: "Saat değişikliği bekleniyor",
  in_progress: "Devam ediyor",
  awaiting_report: "Rapor bekleniyor",
  completed: "Tamamlandı",
  student_no_show: "Öğrenci katılmadı",
  tutor_no_show: "Hoca katılmadı",
  cancelled: "İptal edildi",
  technical_failure: "Teknik sorun",
};

/**
 * The one Turkish label for a coaching session status. Unknown values get a
 * neutral sentence: a raw backend code must never reach the screen.
 */
export function coachingSessionStatusLabel(status: string): string {
  return COACHING_SESSION_STATUS_LABELS[status] ?? "Durum güncelleniyor";
}

/**
 * What the coaching video room shows the other participant. The JaaS token
 * already carries the right name; the client must not override it with the
 * viewer's e-mail address, which leaked it to the other side.
 */
export function coachingRoomUserInfo(
  detail: { tutor_name?: string | null; student_name?: string | null } | undefined,
  viewerRole: "student" | "tutor",
): { displayName: string; email: string } {
  const own = viewerRole === "tutor" ? detail?.tutor_name : detail?.student_name;
  return {
    displayName: own?.trim() || (viewerRole === "tutor" ? "Hoca" : "Öğrenci"),
    email: "",
  };
}

export type StudentCoachingNextStep =
  | { kind: "next_session"; startsAt: string }
  | { kind: "no_upcoming_session" }
  | { kind: "pick_schedule" }
  | { kind: "message"; text: string };

/**
 * The one line under the student's coaching status. Each service status gets
 * its own sentence: "Koçluk saatini seç" used to be the fallback for every
 * state that was not active, so a cancelled or completed coaching still
 * asked the student to pick a time.
 */
export function studentCoachingNextStep(
  serviceStatus: string,
  sessions: { status: string; scheduled_start: string }[] | undefined,
): StudentCoachingNextStep {
  switch (serviceStatus) {
    case "active":
    case "cancellation_pending": {
      const next = sessions?.find((s) => s.status === "scheduled" || s.status === "in_progress");
      if (next) return { kind: "next_session", startsAt: next.scheduled_start };
      if (serviceStatus === "cancellation_pending") {
        return {
          kind: "message",
          text: "İptal talebin işleniyor. Devam eden dönemin görüşmeleri sürer.",
        };
      }
      return { kind: "no_upcoming_session" };
    }
    case "accepted_awaiting_schedule":
      return { kind: "pick_schedule" };
    case "accepted_awaiting_payment":
      return {
        kind: "message",
        text: "Öğretmenin koçluk talebini kabul etti. Ödeme doğrulandıktan sonra görüşme saatini seçebilirsin.",
      };
    case "pending_tutor_acceptance":
      return { kind: "message", text: "Koçluk talebin öğretmeninin onayını bekliyor." };
    case "paused_by_platform":
      return {
        kind: "message",
        text: "Koçluğun platform tarafından geçici olarak durduruldu. Ayrıntı için destekle iletişime geçebilirsin.",
      };
    case "completed":
      return { kind: "message", text: "Koçluk dönemin tamamlandı. Raporların ve programın burada kalır." };
    case "cancelled":
    case "rejected":
    case "refunded":
      return { kind: "message", text: "Bu koçluk sona erdi. Geçmiş raporların ve programın burada kalır." };
    default:
      return { kind: "message", text: "Koçluk durumun güncelleniyor." };
  }
}

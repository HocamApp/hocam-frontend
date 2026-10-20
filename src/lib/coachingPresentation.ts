import type {
  AcceptanceRequest,
  CoachingCapacityDetail,
  CoachingPlan,
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

export type CoachingSetupStepKey = Exclude<CoachingReadinessState, "complete">;
export type CoachingSetupStepState = "done" | "current" | "pending";

export interface CoachingSetupStepRow {
  key: CoachingSetupStepKey;
  title: string;
  /** What the step covers, when its name alone does not say. */
  hint: string | null;
  /** What the step asks for; shown only while it is the open one. */
  detail: string;
  state: CoachingSetupStepState;
}

const COACHING_SETUP_STEP_ROWS: readonly Omit<CoachingSetupStepRow, "state">[] = [
  {
    key: "onboarding",
    title: "Tanıtım",
    hint: null,
    detail: "Koçluğun nasıl işlediğini gözden geçir; bitirince teklifini hazırlayabilirsin.",
  },
  {
    key: "plan",
    title: "Teklif",
    hint: "düzen, fiyat, sınavlar, açıklama",
    detail: "Görüşme düzenini, fiyatı, koçluk verdiğin sınavları ve kısa bir açıklamayı belirle.",
  },
  {
    key: "availability",
    title: "Koçluk saatleri",
    hint: null,
    detail: "Öğrencilerin seçebileceği haftalık saatleri sen belirlersin.",
  },
  {
    key: "capacity",
    title: "Kapasite",
    hint: null,
    detail: "Saatlerin seçtiğin kapasiteye yetmiyor: saat ekle ya da kapasiteyi düşür.",
  },
  {
    key: "publish",
    title: "Gözden geçir ve yayınla",
    hint: null,
    detail: "Öğrenci görünümünü kontrol et, sonra teklifini yayınla.",
  },
];

/**
 * The five parts of getting a coaching offer ready, with what is done, what is
 * open and what waits. Read from `readiness` alone: it already names the first
 * thing still missing, so everything before it is done and everything after it
 * waits. A finished setup has every step done.
 */
export function coachingSetupSteps(readiness: CoachingReadinessState): CoachingSetupStepRow[] {
  const open = COACHING_SETUP_STEP_ROWS.findIndex((step) => step.key === readiness);
  return COACHING_SETUP_STEP_ROWS.map((step, index) => ({
    ...step,
    state: open === -1 || index < open ? "done" : index === open ? "current" : "pending",
  }));
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
    case "paused_by_platform":
      return {
        kind: "message",
        text: "Koçluğun platform tarafından geçici olarak durduruldu. Ayrıntı için destekle iletişime geçebilirsin.",
      };
    // The scheduling endpoint answers 404 while a request still waits for the
    // tutor and once a coaching has completed, so those two never reach this
    // function. A cancelled, rejected or refunded one does, through the refund
    // obligation the server keeps for it.
    case "cancelled":
    case "rejected":
    case "refunded":
      return { kind: "message", text: "Bu koçluk sona erdi. Geçmiş raporların Raporlar sekmesinde kalır." };
    default:
      return { kind: "message", text: "Koçluk durumun güncelleniyor." };
  }
}

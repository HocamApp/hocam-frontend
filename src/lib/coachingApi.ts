/**
 * Coaching API client (Faz 2 — tutor side only).
 *
 * Two contracts worth stating up front, because they shape every call
 * below:
 *
 * 1. **The backend owns the contract.** `acceptCoachingContract()` sends no
 *    body: the version comes from the server's runtime config and the terms
 *    hash from the server's canonical text. The client never asserts either.
 * 2. **The backend owns onboarding progress.** The only things this module
 *    sends are "advance to step N", "here is my answer", "I accept", and
 *    "complete". Verdicts, completion, and the current step come back from
 *    the server.
 *
 * Money is carried as raw `*_minor` integers; `*_display` strings are a
 * convenience the caller may use instead of formatting locally.
 */
import api from "./api";

// --- Feature flag -----------------------------------------------------

export interface CoachingFlagState {
  enabled: boolean;
  checkout_enabled: boolean;
}

/**
 * Read the runtime coaching state.
 *
 * A 404 means the build-time flag is off, so the route is not mounted at
 * all. That is a valid "coaching is off" answer, not an application error,
 * so it resolves to a disabled state rather than throwing.
 */
export async function fetchCoachingFlag(): Promise<CoachingFlagState> {
  try {
    const response = await api.get<CoachingFlagState>("/coaching/flag/");
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return { enabled: false, checkout_enabled: false };
    }
    throw error;
  }
}

// --- Onboarding -------------------------------------------------------

export interface CoachingCarouselSlide {
  id: string;
  title: string;
  body: string;
}

export interface CoachingControlQuestionOption {
  value: string;
  label: string;
}

export interface CoachingControlQuestion {
  id: string;
  question: string;
  options: CoachingControlQuestionOption[];
}

export interface CoachingContract {
  version: number;
  text: string;
  terms_hash: string;
}

export interface CoachingOnboardingState {
  current_step: number;
  current_step_key: string | null;
  steps: string[];
  is_completed: boolean;
  completed_at: string | null;
  control_question_answers: Record<
    string,
    { answer: string; is_correct: boolean }
  >;
  all_control_questions_correct: boolean;
  has_accepted_current_contract: boolean;
  carousel_slides: CoachingCarouselSlide[];
  control_questions: CoachingControlQuestion[];
  contract?: CoachingContract;
}

export async function fetchCoachingOnboarding(): Promise<CoachingOnboardingState> {
  const response = await api.get<CoachingOnboardingState>("/coaching/onboarding/");
  return response.data;
}

export async function advanceCoachingOnboarding(
  targetStep: number
): Promise<CoachingOnboardingState> {
  const response = await api.post<CoachingOnboardingState>(
    "/coaching/onboarding/advance/",
    { target_step: targetStep }
  );
  return response.data;
}

export interface ControlAnswerResult {
  question_id: string;
  is_correct: boolean;
  explanation: string;
}

export async function submitCoachingControlAnswer(
  questionId: string,
  answer: string
): Promise<ControlAnswerResult> {
  const response = await api.post<ControlAnswerResult>(
    "/coaching/onboarding/answer/",
    { question_id: questionId, answer }
  );
  return response.data;
}

export interface ContractAcceptanceResult {
  contract_version: number;
  accepted_at: string;
}

/** Sends no body on purpose — see the module docstring. */
export async function acceptCoachingContract(): Promise<ContractAcceptanceResult> {
  const response = await api.post<ContractAcceptanceResult>(
    "/coaching/onboarding/accept-contract/"
  );
  return response.data;
}

export async function completeCoachingOnboarding(): Promise<CoachingOnboardingState> {
  const response = await api.post<CoachingOnboardingState>(
    "/coaching/onboarding/complete/"
  );
  return response.data;
}

// --- Plan -------------------------------------------------------------

export type CoachingFrequency = "biweekly" | "weekly" | "twice_weekly";

export interface CoachingCapacity {
  weekly_slot_count: number;
  theoretical_capacity: number;
  max_active_students: number;
  active_students: number;
  is_accepting_new_students: boolean;
  can_accept_new_student: boolean;
}

export interface CoachingPlan {
  id: string;
  frequency: CoachingFrequency;
  session_duration_minutes: number;
  price_per_session_minor: number;
  price_per_session_display: string;
  price_cap_minor: number;
  max_active_students: number;
  target_exam_types: string[];
  description: string;
  is_published: boolean;
  is_accepting_new_students: boolean;
  published_at: string | null;
  capacity: CoachingCapacity | null;
  created_at: string;
  updated_at: string;
}

export interface CoachingPlanPayload {
  frequency: CoachingFrequency;
  price_per_session_minor: number;
  max_active_students: number;
  target_exam_types: string[];
  description: string;
}

/** Resolves to null when the tutor has no plan yet (the API answers 404). */
export async function fetchCoachingPlan(): Promise<CoachingPlan | null> {
  try {
    const response = await api.get<CoachingPlan>("/coaching/plan/");
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function saveCoachingPlan(
  payload: CoachingPlanPayload
): Promise<CoachingPlan> {
  const response = await api.put<CoachingPlan>("/coaching/plan/", payload);
  return response.data;
}

export async function publishCoachingPlan(): Promise<CoachingPlan> {
  const response = await api.post<CoachingPlan>("/coaching/plan/publish/");
  return response.data;
}

export async function unpublishCoachingPlan(): Promise<CoachingPlan> {
  const response = await api.post<CoachingPlan>("/coaching/plan/unpublish/");
  return response.data;
}

export async function closeCoachingToNewStudents(): Promise<CoachingPlan> {
  const response = await api.post<CoachingPlan>(
    "/coaching/plan/close-to-new-students/"
  );
  return response.data;
}

export async function reopenCoachingToNewStudents(): Promise<CoachingPlan> {
  const response = await api.post<CoachingPlan>(
    "/coaching/plan/reopen-to-new-students/"
  );
  return response.data;
}

// --- Availability -----------------------------------------------------

export interface CoachingAvailabilityWindow {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface CoachingAvailabilityPayload {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export async function fetchCoachingAvailability(): Promise<
  CoachingAvailabilityWindow[]
> {
  const response = await api.get<CoachingAvailabilityWindow[]>(
    "/coaching/availability/"
  );
  return response.data;
}

export async function createCoachingAvailability(
  payload: CoachingAvailabilityPayload
): Promise<CoachingAvailabilityWindow> {
  const response = await api.post<CoachingAvailabilityWindow>(
    "/coaching/availability/",
    payload
  );
  return response.data;
}

export async function deleteCoachingAvailability(id: string): Promise<void> {
  await api.delete(`/coaching/availability/${id}/`);
}

// --- Capacity & revenue ----------------------------------------------

export interface CoachingCapacityDetail extends CoachingCapacity {
  slots: { day_of_week: number; start_time: string }[];
}

export async function fetchCoachingCapacity(): Promise<CoachingCapacityDetail | null> {
  try {
    const response = await api.get<CoachingCapacityDetail>("/coaching/capacity/");
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export interface CoachingRevenueRow {
  duration_days: number;
  weeks: number;
  total_sessions: number;
  discount_percent: number;
  subtotal_price_minor: number;
  subtotal_price_display: string;
  discount_amount_minor: number;
  discount_amount_display: string;
  total_price_minor: number;
  total_price_display: string;
  platform_fee_minor: number;
  platform_fee_display: string;
  tutor_net_minor: number;
  tutor_net_display: string;
}

export interface CoachingRevenuePreview {
  commission_bps: number;
  unit_price_minor: number;
  unit_price_display: string;
  rows: CoachingRevenueRow[];
}

export async function fetchCoachingRevenuePreview(): Promise<CoachingRevenuePreview | null> {
  try {
    const response = await api.get<CoachingRevenuePreview>(
      "/coaching/plan/revenue-preview/"
    );
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

// --- Student-view preview --------------------------------------------

export interface CoachingPlanPreview {
  tutor_name: string;
  frequency: CoachingFrequency;
  frequency_display: string;
  session_duration_minutes: number;
  price_per_session_minor: number;
  price_per_session_display: string;
  is_free: boolean;
  target_exam_types: string[];
  description: string;
  capacity_available: boolean;
}

export async function fetchCoachingPlanPreview(): Promise<CoachingPlanPreview | null> {
  try {
    const response = await api.get<CoachingPlanPreview>("/coaching/plan/preview/");
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

// --- Error helpers ----------------------------------------------------

/**
 * Pull a stable error code out of a coaching API error.
 *
 * DRF wraps serializer error values in arrays, so a `{code: "x"}` raised
 * from a serializer arrives as `{code: ["x"]}` while a view-built payload
 * arrives as `{code: "x"}`. Both are normalised here so callers can switch
 * on the code without caring which layer produced it.
 */
export function extractCoachingErrorCode(error: unknown): string | null {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response
    ?.data;
  if (!data) return null;
  const raw = data.code;
  if (Array.isArray(raw)) return raw.length ? String(raw[0]) : null;
  if (typeof raw === "string") return raw;
  return null;
}

const ERROR_MESSAGES: Record<string, string> = {
  onboarding_incomplete:
    "Plan oluşturmadan önce koçluk onboarding'ini tamamlamalısın.",
  plan_incomplete: "Planında eksik alanlar var.",
  price_exceeds_cap:
    "Koçluk görüşme fiyatı, ders fiyatının en fazla %75'i olabilir.",
  availability_required:
    "Koçluk müsaitliği eklemeden planını yayınlayamazsın.",
  capacity_required: "En az 1 öğrencilik kapasite belirlemelisin.",
  capacity_exceeds_theoretical:
    "Koçluk müsaitliğin bu kapasiteye yetmiyor. Müsaitlik ekle veya kapasiteyi düşür.",
  availability_overlap: "Bu aralık mevcut bir koçluk müsaitliğiyle çakışıyor.",
  has_active_students:
    "Aktif koçluk öğrencin varken planı taslağa alamazsın.",
  plan_required: "Önce bir koçluk planı oluştur.",
  contract_version_hash_mismatch:
    "Koçluk sözleşmesinde bir yapılandırma sorunu var. Lütfen destekle iletişime geç.",
  // --- Faz 4: recurring scheduling, time requests, reschedule ---------
  not_awaiting_schedule: "Bu koçluk şu anda saat seçimine açık değil.",
  scheduling_deadline_expired: "Saat seçme süren doldu.",
  slot_unavailable: "Bu saat artık uygun değil. Lütfen listeyi yenile.",
  slot_outside_coaching_availability:
    "Bu saat öğretmenin yayınlanmış koçluk müsaitliğinin dışında.",
  lesson_conflict: "Bu saat mevcut bir dersle çakışıyor.",
  coaching_conflict: "Bu saat başka bir koçluk görüşmesiyle çakışıyor.",
  duplicate_slot: "Aynı gün ve saat iki kez seçilemez.",
  frequency_slot_count_mismatch: "Seçilmesi gereken saat sayısı planınla uyuşmuyor.",
  plan_unpublished: "Öğretmenin koçluk planı artık yayında değil.",
  requested_time_pending: "Bu saat için zaten açık bir talebin var.",
  requested_time_expired: "Bu talebin yanıt süresi doldu.",
  requested_time_rejected: "Bu öneri artık geçerli değil.",
  reschedule_pending: "Bu görüşme için zaten bekleyen bir değişiklik talebi var.",
  session_not_reschedulable: "Bu görüşme şu anda yeniden planlanamaz.",
  // --- Faz 5: session participation, attendance, attachments ----------
  too_early: "Görüşme odası henüz açılmadı.",
  session_ended: "Bu görüşme sona erdi.",
  session_not_active: "Bu görüşme şu anda aktif değil.",
  invalid_transition: "Bu işlem şu an için geçerli değil.",
  session_service_period_mismatch: "Bu dosya bu görüşmeye ait değil.",
  not_a_participant: "Bu koçluğun katılımcısı değilsin.",
  invalid_file: "PDF, JPG, PNG, WebP, DOCX veya PPTX dosyası yükleyin.",
};

/** Human-readable message for a coaching error, preferring the server's own. */
export function extractCoachingErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response
    ?.data;
  const code = extractCoachingErrorCode(error);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  // A non-JSON error body (e.g. an HTML 500/502 page from a dev server or
  // proxy) arrives here as a raw string. Object.values() on a string
  // yields its individual CHARACTERS as "values" — without this guard,
  // that silently surfaced the response body's first character (commonly
  // "<" from "<!DOCTYPE...") as the entire error message instead of a
  // sane fallback.
  if (data && typeof data === "object") {
    const detail = (data as Record<string, unknown>).detail;
    if (typeof detail === "string") return detail;
    // Field errors: surface the first message we can find, including the
    // structured description-guardrail payload.
    for (const value of Object.values(data)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && "message" in first) {
        return String((first as { message: unknown }).message);
      }
    }
  }
  return "Beklenmeyen bir hata oluştu.";
}

// --- Student checkout surface (Faz 3) ---------------------------------

export type CoachingEligibilityReason =
  | "ok"
  | "no_plan"
  | "no_availability"
  | "capacity_full"
  | "intake_closed"
  | "exam_mismatch"
  | "unsupported_exam_configuration"
  | "missing_target_exam"
  | "has_active_coach"
  | "price_over_cap";

export interface CoachingEligibilityPlan {
  frequency: CoachingFrequency;
  session_duration_minutes: number;
  price_per_session_minor: number;
  price_per_session_display: string;
  is_free: boolean;
  target_exam_types: string[];
  description: string;
}

export interface CoachingEligibility {
  eligible: boolean;
  reason: CoachingEligibilityReason;
  message: string;
  plan: CoachingEligibilityPlan | null;
  available_exam_targets?: string[];
}

/**
 * Per-student, never cached. The frontend renders the returned reason and
 * decides nothing about eligibility itself — exam matching, active-coach
 * and capacity checks all live server-side.
 */
export async function fetchCoachingEligibility(
  tutorId: string
): Promise<CoachingEligibility | null> {
  try {
    const response = await api.get<CoachingEligibility>("/coaching/eligibility/", {
      params: { tutor: tutorId },
    });
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    // 404 (coaching not built in) or 403 (runtime flag off) both mean
    // "coaching is not on offer", not "something broke".
    if (status === 404 || status === 403) return null;
    throw error;
  }
}

export interface CoachingQuote {
  duration_days: number;
  lessons_per_week: number;
  weeks: number;
  total_sessions: number;
  discount_percent: number;
  commission_bps: number;
  unit_price_minor: number;
  unit_price_display: string;
  subtotal_price_minor: number;
  subtotal_price_display: string;
  discount_amount_minor: number;
  discount_amount_display: string;
  total_price_minor: number;
  total_price_display: string;
  platform_fee_minor: number;
  tutor_net_minor: number;
  is_free: boolean;
  quote_fingerprint: string;
}

export async function fetchCoachingPricePreview(params: {
  tutorId: string;
  durationDays: number;
  lessonsPerWeek: number;
}): Promise<CoachingQuote | null> {
  try {
    const response = await api.get<CoachingQuote>("/coaching/price-preview/", {
      params: {
        tutor: params.tutorId,
        duration_days: params.durationDays,
        lessons_per_week: params.lessonsPerWeek,
      },
    });
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 403 || status === 400) return null;
    throw error;
  }
}

export interface CoachingHold {
  id: string;
  /** Server-issued. The countdown is driven from this, never from a
   *  client-side 15-minute timer — the browser clock is not authoritative. */
  expires_at: string;
  quote_fingerprint: string;
  duration_days: number;
  lessons_per_week: number;
  total_sessions: number;
  total_price_minor: number;
  total_price_display: string;
}

export async function fetchCoachingHold(tutorId: string): Promise<CoachingHold | null> {
  try {
    const response = await api.get<{ hold: CoachingHold | null }>("/coaching/hold/", {
      params: { tutor: tutorId },
    });
    return response.data.hold;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404 || status === 403) return null;
    throw error;
  }
}

export async function createCoachingHold(params: {
  tutorId: string;
  durationDays: number;
  lessonsPerWeek: number;
  idempotencyKey: string;
}): Promise<{ hold: CoachingHold; quote: CoachingQuote }> {
  const response = await api.post<{ hold: CoachingHold; quote: CoachingQuote }>(
    "/coaching/hold/",
    {
      tutor: params.tutorId,
      duration_days: params.durationDays,
      lessons_per_week: params.lessonsPerWeek,
      idempotency_key: params.idempotencyKey,
    }
  );
  return response.data;
}

// --- Tutor acceptance (payments-owned, coaching-independent) ------------

export interface TutorAcceptanceConfig {
  enabled: boolean;
  has_open_requests: boolean;
  acceptance_expiry_hours: number;
}

/**
 * Deliberately NOT read from /coaching/flag/: that route is unmounted when
 * the backend's coaching build flag is off, and lesson-only package
 * acceptance has to keep working — and stay visible — regardless.
 */
export async function fetchTutorAcceptanceConfig(): Promise<TutorAcceptanceConfig> {
  try {
    const response = await api.get<TutorAcceptanceConfig>(
      "/payments/tutor-acceptance/config/"
    );
    return response.data;
  } catch {
    return { enabled: false, has_open_requests: false, acceptance_expiry_hours: 48 };
  }
}

export type AcceptanceStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "expired"
  | "withdrawn";

export interface AcceptanceRequest {
  id: string;
  student: { id: string; name: string; surname: string };
  package: {
    id: string;
    plan_name: string;
    lessons_per_week: number | null;
    duration_days: number | null;
    total_credits: number;
    total_price: number;
  };
  coaching: {
    frequency: CoachingFrequency;
    total_sessions: number;
    total_price_minor: number;
    service_status: string;
  } | null;
  includes_coaching: boolean;
  status: AcceptanceStatus;
  purchase_status: string;
  requested_at: string;
  expires_at: string;
  responded_at: string | null;
  rejection_reason: string;
  rejection_note: string;
}

export async function fetchAcceptanceRequests(): Promise<AcceptanceRequest[]> {
  const response = await api.get<AcceptanceRequest[]>(
    "/payments/tutor-acceptance/requests/"
  );
  return response.data;
}

export async function respondToAcceptanceRequest(params: {
  id: string;
  decision: "accept" | "reject";
  reasonCode?: string;
  note?: string;
}): Promise<AcceptanceRequest> {
  const response = await api.post<AcceptanceRequest>(
    `/payments/tutor-acceptance/requests/${params.id}/respond/`,
    {
      decision: params.decision,
      ...(params.reasonCode ? { reason_code: params.reasonCode } : {}),
      ...(params.note ? { note: params.note } : {}),
    }
  );
  return response.data;
}

/**
 * Honest status copy. Nothing here may say "ödendi", "iade edildi",
 * "para çekildi" or "hakediş oluştu" — no payment provider is connected,
 * so an accepted request is exactly that and nothing more.
 */
export const ACCEPTANCE_STATUS_COPY: Record<string, string> = {
  pending: "Öğretmen yanıtı bekleniyor",
  accepted: "Öğretmen kabul etti. Ödeme aktivasyonu bekleniyor.",
  rejected: "Öğretmen talebi kabul etmedi",
  expired: "Talebin yanıt süresi doldu",
  withdrawn: "Talep geri çekildi",
  cancelled: "Talep iptal edildi",
};

export function acceptanceStatusCopy(status: string): string {
  return ACCEPTANCE_STATUS_COPY[status] ?? "Talep durumu bilinmiyor";
}

// --- shared student-facing copy ----------------------------------------

/**
 * Session frequency labels.
 *
 * Single source: the tutor profile section, the checkout choice card and
 * the checkout summary all read this. Three copies of the same three
 * strings is exactly how "haftada 1" and "Haftada 1" end up on adjacent
 * screens.
 */
export const COACHING_FREQUENCY_LABEL: Record<string, string> = {
  biweekly: "İki haftada 1 görüşme",
  weekly: "Haftada 1 görüşme",
  twice_weekly: "Haftada 2 görüşme",
};

export function coachingFrequencyLabel(frequency: string): string {
  return COACHING_FREQUENCY_LABEL[frequency] ?? frequency;
}

/**
 * "Koçluk nasıl çalışır?" — the same six lines on the profile and on the
 * checkout choice screen.
 *
 * Nothing here may promise a payment, refund or payout: no provider is
 * connected. Cancellation and refund rules are linked, not restated.
 */
export const COACHING_HOW_IT_WORKS: string[] = [
  "Koçluk ders paketine bağlıdır; tek başına satın alınamaz.",
  "Bütün koçluk görüşmeleri 30 dakikadır.",
  "Görüşme saatini, öğretmen talebini kabul ettikten sonra seçersin.",
  "Mesajlarına 24 saat içinde yanıt verilir.",
  "Dönemsel haklar birikmez; kullanılmayan görüşme sonraki döneme devretmez.",
  "İptal, katılmama ve iade kurallarını destek sayfasından okuyabilirsin.",
];

// --- student side of a package request ---------------------------------

export interface PurchaseAcceptanceState {
  requires_tutor_acceptance: boolean;
  acceptance: {
    id: string;
    status: AcceptanceStatus | "cancelled";
    expires_at: string;
    responded_at: string | null;
    includes_coaching: boolean;
  } | null;
  purchase_status?: string;
  coaching_service_status?: string | null;
  can_withdraw?: boolean;
  can_cancel_unpaid?: boolean;
}

/**
 * The student's own view of their request.
 *
 * Lives here rather than in paymentsApi because the acceptance layer is
 * what it describes, but note the URLs: every one of these is under
 * `/payments/`, not `/coaching/`. A lesson-only request goes through the
 * exact same three endpoints, and they stay mounted with coaching switched
 * off.
 */
export async function fetchPurchaseAcceptanceState(
  purchaseId: string
): Promise<PurchaseAcceptanceState> {
  const response = await api.get<PurchaseAcceptanceState>(
    `/payments/package-purchases/${purchaseId}/acceptance-status/`
  );
  return response.data;
}

/** Pull a request back BEFORE the tutor answered. */
export async function withdrawPackageRequest(
  purchaseId: string
): Promise<PurchaseAcceptanceState> {
  const response = await api.post<PurchaseAcceptanceState>(
    `/payments/package-purchases/${purchaseId}/withdraw/`
  );
  return response.data;
}

/**
 * Back out AFTER the tutor accepted but before payment activation.
 *
 * Not a refund and not a withdrawal: no money ever moved, and the
 * acceptance record stays `accepted` because the tutor really did say yes.
 */
export async function cancelUnpaidPackagePurchase(
  purchaseId: string
): Promise<PurchaseAcceptanceState> {
  const response = await api.post<PurchaseAcceptanceState>(
    `/payments/package-purchases/${purchaseId}/cancel-unpaid/`
  );
  return response.data;
}

// =========================================================================
// Faz 4 — recurring scheduling, 48h time-request fallback, reschedule,
// recurring-time-change.
//
// Every deadline/expiry shown to the user comes from a server timestamp
// (`slot_selection_deadline_at`, `expires_at`) — this module never adds
// "7 days" or "48 hours" on the client. The server is the only clock.
// =========================================================================

export interface CoachingSchedulingState {
  id: string;
  service_status: string;
  frequency: CoachingFrequency;
  weeks: number;
  total_sessions: number;
  slot_selection_deadline_at: string | null;
  required_slot_count: number;
}

export async function fetchCoachingSchedulingState(): Promise<CoachingSchedulingState | null> {
  try {
    const response = await api.get<CoachingSchedulingState>("/coaching/scheduling/");
    return response.data;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export interface CoachingAvailableSlot {
  day_of_week: number;
  start_time: string;
}

export interface CoachingAcceptedProposal {
  day_of_week: number;
  start_time: string;
}

export interface CoachingSchedulingSlots {
  availability_slots: CoachingAvailableSlot[];
  accepted_proposals: Record<number, CoachingAcceptedProposal>;
}

export async function fetchCoachingSchedulingSlots(): Promise<CoachingSchedulingSlots> {
  const response = await api.get<CoachingSchedulingSlots>("/coaching/scheduling/slots/");
  return response.data;
}

export interface SubmittedRecurringSlot {
  slot_index: number;
  day_of_week: number;
  start_time: string;
}

export interface CoachingSchedulingConfirmResult {
  service_period_id: string;
  starts_on: string;
  ends_on: string;
  sessions_planned: number;
}

export async function confirmCoachingRecurringSlots(
  slots: SubmittedRecurringSlot[]
): Promise<CoachingSchedulingConfirmResult> {
  const response = await api.post<CoachingSchedulingConfirmResult>(
    "/coaching/scheduling/confirm/",
    { slots }
  );
  return response.data;
}

// --- 48h time-request fallback ------------------------------------------

export type CoachingTimeRequestStatus = "pending" | "matched" | "unresolved" | "withdrawn";
export type CoachingTimeProposalStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "superseded";

export interface CoachingTimeProposal {
  id: string;
  day_of_week: number;
  start_time: string;
  status: CoachingTimeProposalStatus;
  proposed_at: string;
  responded_at: string | null;
}

export interface CoachingTimeRequest {
  id: string;
  slot_index: number;
  status: CoachingTimeRequestStatus;
  note: string;
  requested_at: string;
  expires_at: string;
  resolved_at: string | null;
  proposals: CoachingTimeProposal[];
}

export async function fetchCoachingTimeRequests(): Promise<CoachingTimeRequest[]> {
  const response = await api.get<CoachingTimeRequest[]>("/coaching/scheduling/time-request/");
  return response.data;
}

export async function createCoachingTimeRequest(params: {
  slotIndex: number;
  note?: string;
}): Promise<CoachingTimeRequest> {
  const response = await api.post<CoachingTimeRequest>("/coaching/scheduling/time-request/", {
    slot_index: params.slotIndex,
    note: params.note ?? "",
  });
  return response.data;
}

export async function withdrawCoachingTimeRequest(
  timeRequestId: string
): Promise<CoachingTimeRequest> {
  const response = await api.post<CoachingTimeRequest>(
    "/coaching/scheduling/time-request/withdraw/",
    { time_request_id: timeRequestId }
  );
  return response.data;
}

export async function acceptCoachingTimeProposal(
  proposalId: string
): Promise<CoachingTimeProposal> {
  const response = await api.post<CoachingTimeProposal>(
    "/coaching/scheduling/time-request/accept/",
    { proposal_id: proposalId }
  );
  return response.data;
}

export async function declineCoachingTimeProposal(
  proposalId: string
): Promise<CoachingTimeProposal> {
  const response = await api.post<CoachingTimeProposal>(
    "/coaching/scheduling/time-request/decline/",
    { proposal_id: proposalId }
  );
  return response.data;
}

// --- sessions + single-session reschedule --------------------------------

export type CoachingSessionStatus =
  | "scheduled"
  | "reschedule_requested"
  | "in_progress"
  | "awaiting_report"
  | "completed"
  | "student_no_show"
  | "tutor_no_show"
  | "cancelled"
  | "technical_failure";

export interface CoachingSessionItem {
  id: string;
  sequence_number: number;
  week_index: number;
  status: CoachingSessionStatus;
  scheduled_start: string;
  scheduled_local_date: string;
  scheduled_local_time: string;
  duration_minutes: number;
  reschedule_count: number;
  student_name?: string;
}

export async function fetchCoachingSessions(): Promise<CoachingSessionItem[]> {
  const response = await api.get<CoachingSessionItem[]>("/coaching/sessions/");
  return response.data;
}

export interface CoachingSessionDetail extends CoachingSessionItem {
  tutor_name: string;
  student_name: string;
  student_id: string;
  viewer_role: "student" | "tutor";
}

export async function fetchCoachingSessionDetail(
  sessionId: string
): Promise<CoachingSessionDetail> {
  const response = await api.get<CoachingSessionDetail>(`/coaching/sessions/${sessionId}/`);
  return response.data;
}

export async function fetchTutorCoachingSessions(): Promise<CoachingSessionItem[]> {
  const response = await api.get<CoachingSessionItem[]>("/coaching/tutor/sessions/");
  return response.data;
}

export type CoachingRescheduleRequestStatus =
  | "pending"
  | "approved"
  | "auto_approved"
  | "rejected"
  | "expired";

export interface CoachingRescheduleRequestItem {
  id: string;
  session_id: string;
  requested_by: "student" | "tutor";
  original_start: string;
  proposed_start: string;
  is_free: boolean;
  consumes_student_free_entitlement: boolean;
  requires_tutor_approval: boolean;
  granted_free_by_tutor: boolean;
  status: CoachingRescheduleRequestStatus;
  requested_at: string;
  responded_at: string | null;
  rejection_reason: string;
}

export async function requestCoachingSessionReschedule(
  sessionId: string,
  params: { localDate: string; localTime: string }
): Promise<CoachingRescheduleRequestItem> {
  const response = await api.post<CoachingRescheduleRequestItem>(
    `/coaching/sessions/${sessionId}/reschedule/`,
    { local_date: params.localDate, local_time: params.localTime }
  );
  return response.data;
}

// --- recurring-time-change (student self-service) -------------------------

export type CoachingRecurringSlotSource = "availability" | "tutor_proposal";

export interface CoachingRecurringSlotItem {
  id: string;
  slot_index: number;
  day_of_week: number;
  start_time: string;
  source: CoachingRecurringSlotSource;
}

export async function changeCoachingRecurringSlot(params: {
  purchaseId: string;
  slotIndex: number;
  newDayOfWeek: number;
  newStartTime: string;
}): Promise<CoachingRecurringSlotItem> {
  const response = await api.post<CoachingRecurringSlotItem>(
    "/coaching/recurring-slots/change/",
    {
      purchase_id: params.purchaseId,
      slot_index: params.slotIndex,
      new_day_of_week: params.newDayOfWeek,
      new_start_time: params.newStartTime,
    }
  );
  return response.data;
}

// --- tutor side ------------------------------------------------------------

export interface CoachingStudentRow {
  purchase_id: string;
  student_name: string;
  service_status: string;
  frequency: CoachingFrequency;
  recurring_slots: CoachingRecurringSlotItem[];
}

export async function fetchCoachingStudents(): Promise<CoachingStudentRow[]> {
  const response = await api.get<CoachingStudentRow[]>("/coaching/students/");
  return response.data;
}

export async function fetchTutorCoachingTimeRequests(): Promise<CoachingTimeRequest[]> {
  const response = await api.get<CoachingTimeRequest[]>("/coaching/tutor/time-requests/");
  return response.data;
}

export async function proposeCoachingTime(
  timeRequestId: string,
  params: { dayOfWeek: number; startTime: string }
): Promise<CoachingTimeProposal> {
  const response = await api.post<CoachingTimeProposal>(
    `/coaching/tutor/time-requests/${timeRequestId}/propose/`,
    { day_of_week: params.dayOfWeek, start_time: params.startTime }
  );
  return response.data;
}

export async function fetchTutorCoachingRescheduleRequests(): Promise<
  CoachingRescheduleRequestItem[]
> {
  const response = await api.get<CoachingRescheduleRequestItem[]>(
    "/coaching/tutor/reschedule-requests/"
  );
  return response.data;
}

export async function respondToCoachingRescheduleRequest(
  requestId: string,
  params: { decision: "approve" | "reject"; grantFree?: boolean; note?: string }
): Promise<CoachingRescheduleRequestItem> {
  const response = await api.post<CoachingRescheduleRequestItem>(
    `/coaching/tutor/reschedule-requests/${requestId}/respond/`,
    {
      decision: params.decision,
      grant_free: params.grantFree ?? false,
      note: params.note ?? "",
    }
  );
  return response.data;
}

export async function tutorChangeCoachingRecurringSlot(params: {
  purchaseId: string;
  slotIndex: number;
  newDayOfWeek: number;
  newStartTime: string;
}): Promise<CoachingRecurringSlotItem> {
  const response = await api.post<CoachingRecurringSlotItem>(
    "/coaching/recurring-slots/tutor-change/",
    {
      purchase_id: params.purchaseId,
      slot_index: params.slotIndex,
      new_day_of_week: params.newDayOfWeek,
      new_start_time: params.newStartTime,
    }
  );
  return response.data;
}

// --- shared UI copy --------------------------------------------------------

export const COACHING_DAY_LABEL: Record<number, string> = {
  0: "Pazartesi",
  1: "Salı",
  2: "Çarşamba",
  3: "Perşembe",
  4: "Cuma",
  5: "Cumartesi",
  6: "Pazar",
};

export const TIME_REQUEST_STATUS_COPY: Record<CoachingTimeRequestStatus, string> = {
  pending: "Öğretmen önerisi bekleniyor",
  matched: "Ortak saat bulundu",
  unresolved: "Ortak saat bulunamadı",
  withdrawn: "Geri çekildi",
};

export const RESCHEDULE_STATUS_COPY: Record<CoachingRescheduleRequestStatus, string> = {
  pending: "Öğretmen onayı bekleniyor",
  approved: "Onaylandı",
  auto_approved: "Otomatik onaylandı",
  rejected: "Reddedildi",
  expired: "Süresi doldu",
};

export interface MyRecurringSlots {
  purchase_id: string | null;
  recurring_slots: CoachingRecurringSlotItem[];
}

export async function fetchMyCoachingRecurringSlots(): Promise<MyRecurringSlots> {
  const response = await api.get<MyRecurringSlots>("/coaching/my-recurring-slots/");
  return response.data;
}

// --- Faz 5: session token, no-show, technical issue, attendance,
// attachments. Every timestamp below is server-issued (server_time on the
// token response, requested_at/created_at on others) — this module never
// computes a deadline or "is it time yet" decision client-side; see
// CoachingSessionTokenView's own docstring for why the token GET itself
// never mutates anything.

export interface CoachingSessionToken {
  token: string;
  room: string;
  domain: string;
  server_time: string;
  session_status: CoachingSessionStatus;
}

export async function fetchCoachingSessionToken(
  sessionId: string
): Promise<CoachingSessionToken> {
  const response = await api.get<CoachingSessionToken>(
    `/coaching/sessions/${sessionId}/session-token/`
  );
  return response.data;
}

export async function reportCoachingSessionNoShow(
  sessionId: string,
  party: "student" | "tutor"
): Promise<{ status: CoachingSessionStatus }> {
  const response = await api.post<{ status: CoachingSessionStatus }>(
    `/coaching/sessions/${sessionId}/report-no-show/`,
    { party }
  );
  return response.data;
}

export async function reportCoachingSessionTechnicalIssue(
  sessionId: string
): Promise<{ status: CoachingSessionStatus }> {
  const response = await api.post<{ status: CoachingSessionStatus }>(
    `/coaching/sessions/${sessionId}/report-technical-issue/`,
    {}
  );
  return response.data;
}

export interface CoachingSessionAttendanceSummaryEntry {
  first_joined_at: string | null;
  last_left_at: string | null;
  join_count: number;
  total_connected_seconds: number;
}

export interface CoachingSessionAttendanceSummary {
  student: CoachingSessionAttendanceSummaryEntry;
  tutor: CoachingSessionAttendanceSummaryEntry;
}

export async function fetchCoachingSessionAttendanceSummary(
  sessionId: string
): Promise<CoachingSessionAttendanceSummary> {
  const response = await api.get<CoachingSessionAttendanceSummary>(
    `/coaching/sessions/${sessionId}/attendance-summary/`
  );
  return response.data;
}

export interface CoachingAttachmentItem {
  id: string;
  session_id: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_role: "student" | "tutor";
  created_at: string;
}

export async function fetchCoachingSessionAttachments(
  sessionId: string
): Promise<CoachingAttachmentItem[]> {
  const response = await api.get<CoachingAttachmentItem[]>(
    `/coaching/sessions/${sessionId}/attachments/`
  );
  return response.data;
}

export async function uploadCoachingSessionAttachment(
  sessionId: string,
  file: File
): Promise<CoachingAttachmentItem> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<CoachingAttachmentItem>(
    `/coaching/sessions/${sessionId}/attachments/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
}

export async function fetchCoachingAttachmentDownloadUrl(
  attachmentId: string
): Promise<{ url: string }> {
  const response = await api.get<{ url: string }>(
    `/coaching/attachments/${attachmentId}/download/`
  );
  return response.data;
}

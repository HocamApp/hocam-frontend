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
};

/** Human-readable message for a coaching error, preferring the server's own. */
export function extractCoachingErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response
    ?.data;
  const code = extractCoachingErrorCode(error);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  if (data) {
    const detail = data.detail;
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

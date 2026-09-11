import type { TutorProfile } from "@/types";

export type TrialBookingUnavailableReason =
  | "sign_in_required"
  | "student_account_required"
  | "own_profile"
  | "monthly_quota"
  | "already_used_with_tutor"
  | "tutor_not_accepting_trials"
  | "tutor_capacity_full"
  | "no_available_time"
  | "unavailable";

export type TrialBookingAvailability = "eligible" | TrialBookingUnavailableReason;

export interface TrialBookingViewer {
  isAuthenticated: boolean;
  isStudent: boolean;
  userId: string | null;
}

export type TrialBookingPreparation =
  | { status: "eligible"; tutor: TutorProfile }
  | { status: "unavailable"; reason: TrialBookingUnavailableReason };

export async function prepareTrialBooking(
  tutorId: string,
  viewer: TrialBookingViewer,
  fetchTutorDetail: (id: string) => Promise<TutorProfile>,
): Promise<TrialBookingPreparation> {
  if (!viewer.isAuthenticated) {
    return { status: "unavailable", reason: "sign_in_required" };
  }

  const tutor = await fetchTutorDetail(tutorId);
  const availability = resolveTrialBookingAvailability(tutor, viewer);
  return availability === "eligible"
    ? { status: "eligible", tutor }
    : { status: "unavailable", reason: availability };
}

export function resolveTrialBookingAvailability(
  tutor: TutorProfile,
  viewer: TrialBookingViewer,
): TrialBookingAvailability {
  if (!viewer.isAuthenticated) return "sign_in_required";
  if (viewer.userId === tutor.user) return "own_profile";
  if (!viewer.isStudent) return "student_account_required";
  if (tutor.accepts_trial_lessons === false) return "tutor_not_accepting_trials";
  if (tutor.accepting_new_students === false || tutor.open_student_slots === 0) {
    return "tutor_capacity_full";
  }
  if (tutor.is_bookable === false) return "no_available_time";
  if ((tutor.trial_lessons_remaining ?? 0) <= 0) return "monthly_quota";
  if (tutor.trial_lesson_eligible === true) return "eligible";
  if (tutor.trial_lesson_eligible === false) return "already_used_with_tutor";
  return "unavailable";
}

const unavailableCopy: Record<
  TrialBookingUnavailableReason,
  { title: string; description: string }
> = {
  sign_in_required: {
    title: "Önce giriş yapmalısın",
    description: "Ücretsiz deneme dersi ayırtmak için öğrenci hesabınla giriş yap.",
  },
  student_account_required: {
    title: "Öğrenci hesabı gerekli",
    description: "Ücretsiz deneme dersleri yalnızca öğrenci hesaplarıyla ayırtılabilir.",
  },
  own_profile: {
    title: "Kendi profilinden ders alamazsın",
    description: "Deneme dersi ayırtmak için bir öğrenci hesabıyla başka bir hoca seç.",
  },
  monthly_quota: {
    title: "Bu ayki deneme dersi hakların doldu",
    description: "Yeni ücretsiz deneme dersi hakkın gelecek ay yenilenecek.",
  },
  already_used_with_tutor: {
    title: "Bu hocayla deneme hakkını kullandın",
    description: "Aynı hocayla yalnızca bir ücretsiz deneme dersi ayırtabilirsin.",
  },
  tutor_not_accepting_trials: {
    title: "Bu hoca deneme dersi vermiyor",
    description: "Hocanın profilinden ücretli ders seçeneklerini inceleyebilirsin.",
  },
  tutor_capacity_full: {
    title: "Hocanın kontenjanı dolu",
    description: "Bu hoca şu anda yeni öğrenci kabul etmiyor. Daha sonra tekrar kontrol edebilirsin.",
  },
  no_available_time: {
    title: "Şu anda uygun saat yok",
    description: "Bu hocanın ayırtılabilir bir saati bulunmuyor. Daha sonra tekrar kontrol edebilirsin.",
  },
  unavailable: {
    title: "Deneme dersi şu anda kullanılamıyor",
    description: "Bilgiler doğrulanamadı. Lütfen kısa bir süre sonra tekrar dene.",
  },
};

export function trialBookingUnavailableCopy(reason: TrialBookingUnavailableReason) {
  return unavailableCopy[reason];
}

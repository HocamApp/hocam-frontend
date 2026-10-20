import type {
  CoachingCapacityDetail,
  CoachingPlan,
  CoachingRevenuePreview,
  CoachingSetupConfig,
} from "./coachingApi";
import type { CoachingSetupStep } from "./coachingSetup";
import { COACHING_DAY_SHORT } from "./coachingTime";
import { formatTryMinorTight as lira } from "./money";

/** One saved setting, worded for the summary list and the review checklist. */
export interface CoachingSettingRow {
  step: Exclude<CoachingSetupStep, "publish">;
  label: string;
  value: string;
  /** A second, quieter line, or null when there is nothing to add. */
  hint: string | null;
  /** The short form shown on a finished step's chip, or null for none. */
  chip: string | null;
}

function slotDays(capacity: CoachingCapacityDetail | null): string | null {
  if (!capacity || capacity.slots.length === 0) return null;
  const days = Array.from(new Set(capacity.slots.map((slot) => slot.day_of_week)))
    .sort((a, b) => a - b)
    .map((day) => COACHING_DAY_SHORT[day])
    .filter(Boolean);
  return days.length > 0 ? days.join(", ") : null;
}

export function buildCoachingSettingRows({
  plan,
  setupConfig,
  capacity,
  revenue,
}: {
  plan: CoachingPlan;
  setupConfig: CoachingSetupConfig;
  capacity: CoachingCapacityDetail | null;
  revenue: CoachingRevenuePreview | null;
}): CoachingSettingRow[] {
  const option = setupConfig.frequency_options.find((item) => item.value === plan.frequency);
  const frequencyLabel = option?.label ?? plan.frequency;
  const month = option?.packages.find((item) => item.weeks === 4) ?? option?.packages[0];

  const isFree = plan.price_per_session_minor === 0;
  const earnings = revenue?.rows.find((row) => row.weeks === 4) ?? revenue?.rows[0];

  const description = plan.description.trim();
  const slotCount = capacity?.weekly_slot_count ?? 0;

  return [
    {
      step: "frequency",
      label: "Görüşme düzeni",
      value: frequencyLabel,
      hint: month
        ? `${month.weeks} haftalık pakette ${month.total_sessions} görüşme · her görüşme ${plan.session_duration_minutes} dk`
        : `Her görüşme ${plan.session_duration_minutes} dk`,
      chip: frequencyLabel,
    },
    {
      step: "price",
      label: "Görüşme fiyatı",
      value: isFree ? "Ücretsiz" : `${lira(plan.price_per_session_minor)} / görüşme`,
      hint:
        !isFree && earnings
          ? `${earnings.weeks} haftalık paket ${lira(earnings.total_price_minor)} · komisyon sonrası eline ${lira(earnings.tutor_net_minor)} geçer`
          : null,
      chip: isFree ? "Ücretsiz" : lira(plan.price_per_session_minor),
    },
    {
      step: "exams",
      label: "Sınavlar",
      value: plan.target_exam_types.join(", "),
      hint: null,
      chip: plan.target_exam_types.join(", "),
    },
    {
      step: "description",
      label: "Açıklama",
      value: description || "Açıklama eklemedin",
      hint: null,
      chip: null,
    },
    {
      step: "availability",
      label: "Koçluk saatlerin",
      value: slotCount > 0 ? `Haftada ${slotCount} görüşme yeri` : "Henüz eklenmedi",
      hint: slotDays(capacity),
      chip: slotCount > 0 ? `${slotCount} görüşme yeri` : null,
    },
    {
      step: "capacity",
      label: "Kapasite",
      value: `En fazla ${plan.max_active_students} öğrenci`,
      hint: capacity
        ? `Şu an ${capacity.active_students} kontenjan dolu · saatlerinle ${capacity.theoretical_capacity} öğrenciye kadar bakabilirsin`
        : null,
      chip: `${plan.max_active_students} öğrenci`,
    },
  ];
}

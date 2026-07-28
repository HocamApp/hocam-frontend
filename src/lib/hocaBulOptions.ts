import { formatPrice } from "@/lib/utils";
import type {
  MatchAvailabilityWindow,
  MatchBudgetSegment,
  MatchChallenge,
  MatchSubjectOption,
  MatchingOptions,
  TutorTeachingStyle,
} from "@/types";
import type {
  HocaBulApiAnswersDraft,
  HocaBulClientAnswers,
  HocaBulExamArea,
  HocaBulGoal,
  HocaBulReviewRow,
} from "@/types/hocaBul";

/**
 * The single place where an API value becomes Turkish text.
 *
 * Values on the left of every map are the backend's own enum members
 * (apps/students/matching.py) — renaming one breaks serializer validation.
 * The labels are frontend wording and can be rewritten freely.
 */

export interface HocaBulOption<Value extends string = string> {
  value: Value;
  label: string;
  detail?: string;
}

export const CHALLENGE_LABELS: Record<MatchChallenge, string> = {
  foundations: "Konu temellerim eksik",
  question_solving: "Konuyu biliyorum ama soruda takılıyorum",
  speed_accuracy: "Netlerimi ve hızımı artırmam gerek",
  consistency: "Düzenli çalışamıyorum",
  where_to_start: "Nereden başlayacağımı bilmiyorum",
  advanced_questions: "Daha zor sorulara geçmek istiyorum",
};

export const CHALLENGE_ORDER: MatchChallenge[] = [
  "foundations",
  "question_solving",
  "speed_accuracy",
  "consistency",
  "where_to_start",
  "advanced_questions",
];

export const TEACHING_STYLE_LABELS: Record<TutorTeachingStyle, string> = {
  foundations_patient: "Sabırla temelden anlatan",
  question_speed: "Bol soru çözdüren",
  planning_accountability: "Program yapıp takip eden",
  motivating_communication: "Motive eden, iletişimi güçlü",
  high_target: "Zorlayan, yüksek hedef odaklı",
};

export const TEACHING_STYLE_DETAILS: Record<TutorTeachingStyle, string> = {
  foundations_patient: "Konuyu adım adım kurar.",
  question_speed: "Pratiğe ve sınav temposuna odaklanır.",
  planning_accountability: "Çalışmanı planlar, ilerlemeni izler.",
  motivating_communication: "Süreç boyunca yanında olur.",
  high_target: "Seni bir üst seviyeye taşımaya çalışır.",
};

export const TEACHING_STYLE_ORDER: TutorTeachingStyle[] = [
  "foundations_patient",
  "question_speed",
  "planning_accountability",
  "motivating_communication",
  "high_target",
];

export const AVAILABILITY_LABELS: Record<MatchAvailabilityWindow, string> = {
  weekday_day: "Hafta içi gündüz",
  weekday_evening: "Hafta içi akşam",
  weekend_day: "Hafta sonu gündüz",
  weekend_evening: "Hafta sonu akşam",
  flexible: "Programım esnek",
};

export const AVAILABILITY_ORDER: MatchAvailabilityWindow[] = [
  "weekday_day",
  "weekday_evening",
  "weekend_day",
  "weekend_evening",
  "flexible",
];

export const EXAM_AREA_LABELS: Record<HocaBulExamArea, string> = {
  TYT: "TYT",
  AYT: "AYT",
  YDT: "YDT",
  unsure: "Emin değilim",
};

export const EXAM_AREA_DETAILS: Partial<Record<HocaBulExamArea, string>> = {
  TYT: "Temel Yeterlilik",
  AYT: "Alan Yeterlilik",
  YDT: "Yabancı Dil",
};

const CONCRETE_EXAM_AREAS: HocaBulExamArea[] = ["TYT", "AYT", "YDT"];

// --- Option adapters ----------------------------------------------------------

export function toGoalOptions(
  options: MatchingOptions
): HocaBulOption<HocaBulGoal>[] {
  return options.goals.map((goal) => ({ value: goal.value, label: goal.label }));
}

export function toStageOptions(
  options: MatchingOptions,
  goal?: HocaBulGoal
): HocaBulOption[] {
  if (!goal) return [];
  return (options.stages[goal] ?? []).map((stage) => ({
    value: stage.value,
    label:
      goal === "KPSS" && stage.value === "ongoing"
        ? "Bir süredir hazırlanıyorum"
        : stage.label,
  }));
}

export function toExamAreaOptions(
  subjects: MatchSubjectOption[]
): HocaBulOption<HocaBulExamArea>[] {
  // P3A deliberately keeps all three official YKS areas visible. Subject
  // availability is applied on the next screen, not by changing this choice set.
  void subjects;
  return [...CONCRETE_EXAM_AREAS, "unsure" as HocaBulExamArea].map((area) => {
    const detail = EXAM_AREA_DETAILS[area];
    return {
      value: area,
      label: EXAM_AREA_LABELS[area],
      ...(detail ? { detail } : {}),
    };
  });
}

export function filterSubjectsByAreas(
  subjects: MatchSubjectOption[],
  areas?: HocaBulExamArea[]
): MatchSubjectOption[] {
  if (!areas || areas.length === 0 || areas.includes("unsure")) return subjects;
  const allowed = new Set(areas);
  return subjects.filter((subject) =>
    subject.exam_types.some((examType) =>
      allowed.has(examType as HocaBulExamArea)
    )
  );
}

/**
 * tutor_count is the server's own count of visible tutors, so a group at zero
 * is hidden rather than shown as an empty promise.
 */
export function toSubjectOptions(
  options: MatchingOptions,
  areas?: HocaBulExamArea[]
): HocaBulOption<string>[] {
  return filterSubjectsByAreas(options.subjects, areas)
    .filter(
      (subject) =>
        Number.isFinite(subject.tutor_count) && subject.tutor_count > 0
    )
    .map((subject) => ({
      value: subject.key,
      label: subject.label,
      detail: `${subject.tutor_count} hoca`,
    }));
}

export function toChallengeOptions(): HocaBulOption<MatchChallenge>[] {
  return CHALLENGE_ORDER.map((value) => ({
    value,
    label: CHALLENGE_LABELS[value],
  }));
}

export function toTeachingStyleOptions(): HocaBulOption<TutorTeachingStyle>[] {
  return TEACHING_STYLE_ORDER.map((value) => ({
    value,
    label: TEACHING_STYLE_LABELS[value],
    detail: TEACHING_STYLE_DETAILS[value],
  }));
}

export function toAvailabilityOptions(): HocaBulOption<MatchAvailabilityWindow>[] {
  return AVAILABILITY_ORDER.map((value) => ({
    value,
    label: AVAILABILITY_LABELS[value],
  }));
}

export function toBudgetOptions(
  options: MatchingOptions
): HocaBulOption<MatchBudgetSegment>[] {
  return options.budget_ranges.map((band) => {
    let detail: string | undefined;
    if (band.min != null && band.max != null) {
      detail = `${formatPrice(band.min)} – ${formatPrice(band.max)} / 40 dk`;
    } else if (band.min != null) {
      detail = `${formatPrice(band.min)} ve üzeri / 40 dk`;
    } else if (band.max != null) {
      detail = `${formatPrice(band.max)}’ye kadar / 40 dk`;
    } else if (band.id === "flexible") {
      detail = "Tüm fiyat aralıklarını değerlendir";
    }

    return {
      value: band.id,
      label: band.label,
      ...(detail ? { detail } : {}),
    };
  });
}

// --- Review rows ----------------------------------------------------------------

function optionFor(
  options: readonly HocaBulOption[],
  value?: string
): HocaBulOption | null {
  if (!value) return null;
  return options.find((option) => option.value === value) ?? null;
}

function joinOptionLabels(
  values: string[] | undefined,
  options: readonly HocaBulOption[]
): string | null {
  if (!values?.length) return null;
  const resolved = values.map((value) => optionFor(options, value));
  if (resolved.some((option) => option === null)) return null;
  return resolved.map((option) => option?.label).join(", ");
}

/**
 * Built once and used by both the review step and the results summary, so a
 * label can never differ between the two screens.
 */
export function buildReviewRows(
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers,
  options: MatchingOptions
): HocaBulReviewRow[] | null {
  const goal = optionFor(toGoalOptions(options), answers.goal);
  const stage = optionFor(toStageOptions(options, answers.goal), answers.stage);
  const areas =
    answers.goal === "YKS"
      ? joinOptionLabels(client.yks_alan, toExamAreaOptions(options.subjects))
      : null;
  const subjects = joinOptionLabels(
    answers.subject_keys,
    toSubjectOptions(options, client.yks_alan)
  );
  const challenges = joinOptionLabels(answers.challenges, toChallengeOptions());
  const teachingStyles = joinOptionLabels(
    answers.teaching_styles,
    toTeachingStyleOptions()
  );
  const availability = joinOptionLabels(
    answers.availability_windows,
    toAvailabilityOptions()
  );
  const budget = optionFor(toBudgetOptions(options), answers.budget_segment);

  if (
    !goal ||
    !stage ||
    (answers.goal === "YKS" && !areas) ||
    !subjects ||
    !challenges ||
    !teachingStyles ||
    !availability ||
    !budget
  ) {
    return null;
  }

  const rows: HocaBulReviewRow[] = [
    {
      stepId: "hedef",
      label: "Hedef",
      value: goal.label,
      isClientOnly: false,
    },
    {
      stepId: "asama",
      label: "Aşama",
      value: stage.label,
      isClientOnly: false,
    },
  ];

  if (answers.goal === "YKS") {
    rows.push({
      stepId: "yks_alan",
      label: "YKS alanı",
      value: areas as string,
      isClientOnly: true,
    });
  }

  rows.push(
    {
      stepId: "dersler",
      label: "Dersler",
      value: subjects,
      isClientOnly: false,
    },
    {
      stepId: "zorluk",
      label: "Zorluk",
      value: challenges,
      isClientOnly: false,
    },
    {
      stepId: "hoca_yaklasimi",
      label: "Hoca yaklaşımı",
      value: teachingStyles,
      isClientOnly: false,
    },
    {
      stepId: "uygun_zamanlar",
      label: "Uygun zamanlar",
      value: availability,
      isClientOnly: false,
    },
    {
      stepId: "butce",
      label: "Bütçe",
      value: budget.label,
      ...(budget.detail ? { detail: budget.detail } : {}),
      isClientOnly: false,
    }
  );

  return rows;
}

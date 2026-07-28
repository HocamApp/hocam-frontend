import { getVisibleSteps, isStepValid } from "@/lib/hocaBulFlow";
import { CHALLENGE_ORDER, TEACHING_STYLE_ORDER } from "@/lib/hocaBulOptions";
import type {
  MatchAvailabilityWindow,
  MatchChallenge,
  TutorTeachingStyle,
} from "@/types";
import type {
  HocaBulApiAnswersDraft,
  HocaBulClientAnswers,
  HocaBulGoal,
  HocaBulStepId,
} from "@/types/hocaBul";

/**
 * Turns wizard answers into the small presentation state the artwork consumes.
 *
 * This is the only place the two worlds meet. Illustrations never see `answers`,
 * `client`, `dispatch` or the options payload — they receive a narrowed member of
 * the union below, which carries counts, booleans and enum members and nothing
 * else. That is what keeps a subject key, a price or a Turkish label out of an
 * SVG.
 *
 * Pure: no React, no DOM, no storage. Every rule it needs (step order, validity)
 * is delegated to hocaBulFlow rather than restated, so completeness can never
 * disagree with the footer's own enabled/disabled logic.
 *
 * The two ORDER constants are imported rather than redeclared for the same
 * reason: a locally-defined order would silently drift from the option list the
 * student actually sees. Only the ordering is used — no label ever is.
 */

/**
 * The 13 stage values the backend defines (apps/students/matching.py STAGES)
 * grouped into five visual phases. One scene per string would mean thirteen
 * near-identical compositions carrying no extra meaning.
 */
export type StagePhase =
  | "exploring"
  | "early"
  | "active"
  | "final"
  | "returning";

export type ConcreteWindow = Exclude<MatchAvailabilityWindow, "flexible">;

export type IllustrationState =
  | { step: "hedef"; goal: HocaBulGoal | null }
  | { step: "asama"; phase: StagePhase | null }
  | {
      step: "yks_alan";
      lanes: { tyt: boolean; ayt: boolean; ydt: boolean };
      unsure: boolean;
    }
  | { step: "dersler"; count: 0 | 1 | 2 | 3 }
  | { step: "zorluk"; gates: MatchChallenge[] }
  | { step: "hoca_yaklasimi"; tools: TutorTeachingStyle[] }
  | {
      step: "uygun_zamanlar";
      windows: Record<ConcreteWindow, boolean>;
      flexible: boolean;
    }
  | { step: "butce"; band: 1 | 2 | 3 | null; flexible: boolean }
  | { step: "kontrol"; filled: number; total: number };

/** Narrows the union to one step, so a component cannot read another's shape. */
export type IllustrationStateFor<Step extends HocaBulStepId> = Extract<
  IllustrationState,
  { step: Step }
>;

const STAGE_PHASE: Record<string, StagePhase> = {
  // YKS
  grade_9: "early",
  grade_10: "early",
  grade_11: "active",
  grade_12: "final",
  graduate: "returning",
  other: "exploring",
  // DGS and KPSS share their vocabulary
  starting: "early",
  ongoing: "active",
  retaking: "returning",
  intensive: "final",
  // UNDECIDED
  exploring: "exploring",
  lesson_support: "exploring",
  exam_considering: "exploring",
};

const BUDGET_BAND: Record<string, 1 | 2 | 3> = {
  economical: 1,
  balanced: 2,
  premium: 3,
};

/**
 * `stages` is served by the backend, so a value this build has never seen is a
 * real possibility rather than a defensive fiction. An unknown stage degrades to
 * the neutral "exploring" scene instead of blanking the column.
 */
export function toStagePhase(stage: string | undefined): StagePhase | null {
  if (!stage) return null;
  return STAGE_PHASE[stage] ?? "exploring";
}

/** Clamped to the rack's three slots; the selection limit itself lives in the flow module. */
function toSubjectCount(keys: string[] | undefined): 0 | 1 | 2 | 3 {
  const count = keys?.length ?? 0;
  if (count <= 0) return 0;
  if (count >= 3) return 3;
  return count as 1 | 2;
}

/**
 * Sorted into the option list's own order so the artwork is independent of the
 * order the student happened to tap in: picking A then B looks the same as B
 * then A.
 */
function orderedSubset<T extends string>(
  values: readonly T[] | undefined,
  order: readonly T[],
  max: number
): T[] {
  if (!values?.length) return [];
  return order.filter((value) => values.includes(value)).slice(0, max);
}

export function toIllustrationState(
  stepId: HocaBulStepId,
  answers: HocaBulApiAnswersDraft,
  client: HocaBulClientAnswers
): IllustrationState {
  switch (stepId) {
    case "hedef":
      return { step: "hedef", goal: answers.goal ?? null };

    case "asama":
      return { step: "asama", phase: toStagePhase(answers.stage) };

    case "yks_alan": {
      const areas = client.yks_alan ?? [];
      return {
        step: "yks_alan",
        lanes: {
          tyt: areas.includes("TYT"),
          ayt: areas.includes("AYT"),
          ydt: areas.includes("YDT"),
        },
        unsure: areas.includes("unsure"),
      };
    }

    case "dersler":
      // Deliberately a count: which subjects were chosen is the question text's
      // business, not the artwork's.
      return { step: "dersler", count: toSubjectCount(answers.subject_keys) };

    case "zorluk":
      return {
        step: "zorluk",
        gates: orderedSubset(answers.challenges, CHALLENGE_ORDER, 2),
      };

    case "hoca_yaklasimi":
      return {
        step: "hoca_yaklasimi",
        tools: orderedSubset(answers.teaching_styles, TEACHING_STYLE_ORDER, 2),
      };

    case "uygun_zamanlar": {
      const windows = answers.availability_windows ?? [];
      const flexible = windows.includes("flexible");
      return {
        step: "uygun_zamanlar",
        // "flexible" is exclusive, and the reducer already enforces that. Reading
        // it as exclusive here too means a stale draft cannot render both.
        windows: {
          weekday_day: !flexible && windows.includes("weekday_day"),
          weekday_evening: !flexible && windows.includes("weekday_evening"),
          weekend_day: !flexible && windows.includes("weekend_day"),
          weekend_evening: !flexible && windows.includes("weekend_evening"),
        },
        flexible,
      };
    }

    case "butce": {
      const segment = answers.budget_segment;
      return {
        step: "butce",
        // Only the position on the scale crosses the boundary — never a price.
        band: segment ? BUDGET_BAND[segment] ?? null : null,
        flexible: segment === "flexible",
      };
    }

    case "kontrol": {
      const steps = getVisibleSteps(answers.goal).filter((step) => !step.isReview);
      return {
        step: "kontrol",
        filled: steps.filter((step) => isStepValid(step.id, answers, client))
          .length,
        total: steps.length,
      };
    }
  }
}

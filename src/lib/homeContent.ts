import type {
  Booking,
  LearningGoalTemplate,
  PackagePurchase,
  StudentGoal,
  Subject,
  TutorProfile,
} from "@/types";

/**
 * Pure selection/derivation logic for the authenticated student home.
 *
 * Kept free of React and of component imports so it can run under the node
 * test runner (`npm run test:unit`). Presentation stays in the components.
 */

export const HOME_EXAM_ORDER = ["TYT", "AYT", "YDT", "DGS", "KPSS"] as const;

/** Maximum tutors requested for the homepage discovery row. */
export const HOME_TUTOR_PAGE_SIZE = 8;

/** Maximum cards rendered by the resume section. */
export const HOME_RESUME_LIMIT = 2;

/** Maximum goal-package cards rendered on the home. */
export const HOME_PACKAGE_LIMIT = 3;

// ---------------------------------------------------------------------------
// Resume / continue
// ---------------------------------------------------------------------------

export type ResumeEntry =
  | { kind: "lesson"; booking: Booking }
  | { kind: "goal"; goal: StudentGoal }
  | { kind: "package"; purchase: PackagePurchase };

/**
 * Next lesson the student can act on: one already running, or the earliest
 * confirmed booking still in the future.
 */
export function firstUpcomingBooking(
  bookings: Booking[],
  now: number = Date.now()
): Booking | undefined {
  return [...bookings]
    .filter((booking) => {
      const status = booking.status.toLowerCase();
      return (
        status === "in_progress" ||
        (status === "confirmed" && new Date(booking.start_time).getTime() > now)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )[0];
}

export function firstActiveGoal(goals: StudentGoal[]): StudentGoal | undefined {
  return goals.find((goal) => goal.status === "active");
}

/**
 * Package the student can still spend credits from. Expiry is injected because
 * `computePackageExpiry`/`isPastPackage` live in a component module; passing
 * them in keeps this file component-free without duplicating their rules.
 */
export function firstActivePackage(
  purchases: PackagePurchase[],
  isPast: (purchase: PackagePurchase) => boolean
): PackagePurchase | undefined {
  return purchases.find(
    (purchase) =>
      purchase.status === "paid" &&
      purchase.remaining_credits > 0 &&
      !isPast(purchase)
  );
}

/**
 * Priority-ordered resume entries: an upcoming lesson outranks an active goal,
 * which outranks unused package credits. Returns an empty array when the
 * student has no state — the caller must then unmount the whole section.
 */
export function selectResumeEntries(
  input: {
    bookings?: Booking[];
    goals?: StudentGoal[];
    purchases?: PackagePurchase[];
    isPastPackage?: (purchase: PackagePurchase) => boolean;
  },
  limit: number = HOME_RESUME_LIMIT
): ResumeEntry[] {
  const entries: ResumeEntry[] = [];

  const booking = firstUpcomingBooking(input.bookings ?? []);
  if (booking) entries.push({ kind: "lesson", booking });

  const goal = firstActiveGoal(input.goals ?? []);
  if (goal && entries.length < limit) entries.push({ kind: "goal", goal });

  const purchase = input.isPastPackage
    ? firstActivePackage(input.purchases ?? [], input.isPastPackage)
    : undefined;
  if (purchase && entries.length < limit) {
    entries.push({ kind: "package", purchase });
  }

  return entries.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Goal packages
// ---------------------------------------------------------------------------

/** Exam match first, then featured, then the server's own order. */
export function prioritizedTemplates(
  templates: LearningGoalTemplate[],
  targetExamType?: string,
  limit: number = HOME_PACKAGE_LIMIT
): LearningGoalTemplate[] {
  return templates
    .map((template, index) => ({ template, index }))
    .sort((a, b) => {
      const aTarget =
        Boolean(targetExamType) &&
        a.template.exam_type.toUpperCase() === targetExamType?.toUpperCase();
      const bTarget =
        Boolean(targetExamType) &&
        b.template.exam_type.toUpperCase() === targetExamType?.toUpperCase();
      if (aTarget !== bTarget) return aTarget ? -1 : 1;
      if (a.template.is_featured !== b.template.is_featured) {
        return a.template.is_featured ? -1 : 1;
      }
      return a.index - b.index;
    })
    .slice(0, limit)
    .map(({ template }) => template);
}

// ---------------------------------------------------------------------------
// Tutor discovery
// ---------------------------------------------------------------------------

/** Deduplicates by id and caps the row, so a repeated API row cannot fill it. */
export function selectHomeTutors(
  tutors: TutorProfile[] | undefined,
  limit: number = HOME_TUTOR_PAGE_SIZE
): TutorProfile[] {
  const seen = new Set<string>();
  return (tutors ?? [])
    .filter((tutor) => {
      if (seen.has(tutor.id)) return false;
      seen.add(tutor.id);
      return true;
    })
    .slice(0, limit);
}

export const HOME_TUTOR_TAB_ALL = "all";

export interface HomeExamTab {
  id: string;
  title: string;
}

/**
 * Exam tabs built from the subjects the API actually returns — never a
 * hardcoded exam list, so a tab can only exist when it has real subjects
 * behind it. Fewer than two exam types means tabs add nothing, so the caller
 * renders the row untabbed.
 */
export function examTabsFromSubjects(
  subjects: Subject[] | undefined
): HomeExamTab[] {
  const present = new Set(
    (subjects ?? [])
      .map((subject) => subject.exam_type?.toUpperCase())
      .filter((examType): examType is string => Boolean(examType))
  );

  const ordered = HOME_EXAM_ORDER.filter((examType) => present.has(examType));
  if (ordered.length < 2) return [];

  return [
    { id: HOME_TUTOR_TAB_ALL, title: "Tümü" },
    ...ordered.map((examType) => ({ id: examType, title: examType })),
  ];
}

export interface HomeTutorQueryParams {
  ordering: string;
  examType: string;
  pageSize: number;
}

/**
 * Every result-affecting parameter belongs in the key, otherwise a tab change
 * would serve another tab's cached page. The key is homepage-scoped so it can
 * never collide with the `/tutors` marketplace cache.
 */
export function buildHomeTutorsQueryKey(params: HomeTutorQueryParams) {
  return [
    "home-tutors",
    {
      ordering: params.ordering,
      examType: params.examType,
      pageSize: params.pageSize,
    },
  ] as const;
}

/** `Tümü` must not be sent to the API as a filter value. */
export function homeTutorFilterFor(examType: string) {
  return examType === HOME_TUTOR_TAB_ALL ? undefined : examType;
}

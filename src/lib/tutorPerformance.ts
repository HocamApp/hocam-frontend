import type { AvailabilityRule, TutorPerformance, TutorProfile } from "@/types";
// TutorPriceInsight is declared with the client that fetches it, not in
// types/api.ts — it has no other consumer.
import type { TutorPriceInsight } from "@/lib/tutorsApi";

/**
 * The six numbers that tell a tutor whether their tutoring is healthy, and a
 * target for each.
 *
 * Targets live here rather than on the server on purpose: what counts as
 * "enough availability" is a product decision, not a fact about the data, and
 * the API's job is to report facts. Two of the six values do come from the API
 * (`TutorPerformance`), because neither can be derived on the client — one
 * needs cancellation attribution, the other needs to walk every message. The
 * other four are computed here from data the dashboard already holds, rather
 * than asking the server for numbers it would only be recomputing.
 *
 * A metric that cannot be computed is `null`, never `0`. A tutor nobody has
 * reviewed has not scored zero, and a card that said so would be lying about
 * them.
 */

export type MetricStatus = "met" | "below" | "unknown";

export interface TutorMetric {
  key: string;
  label: string;
  /** What good looks like, as the tutor should read it. */
  targetLabel: string;
  displayValue: string;
  status: MetricStatus;
  /**
   * True when the metric describes the tutor's profile as it stands rather
   * than a period of their activity — availability, rating, price. The period
   * selector does not apply to these, and saying so is clearer than quietly
   * leaving them unchanged when it moves.
   */
  isLive: boolean;
}

export const TARGETS = {
  /** Zero, not "few". A missed lesson is a student left waiting. */
  missedLessons: 0,
  replyRate: 0.9,
  weeklyAvailabilityHours: 10,
  rating: 4.8,
  profileScore: 90,
} as const;

const PROFILE_SCORE_WEIGHTS = {
  photo: 15,
  bio: 15,
  subjects: 10,
  teachingAttributes: 10,
  introVideo: 20,
  availability: 15,
  availabilityFresh: 15,
} as const;

const MIN_BIO_LENGTH = 200;
const MIN_TEACHING_ATTRIBUTES = 3;
const AVAILABILITY_FRESH_DAYS = 30;

/**
 * Hours a student could book in a normal week.
 *
 * Only weekly recurring windows count. A rule tied to a `specific_date` is an
 * override for one day — it says nothing about the week in general — and
 * `is_unavailable` rules are closures, which have no duration to add.
 */
export function weeklyAvailabilityHours(rules: AvailabilityRule[]): number {
  const minutes = rules.reduce((total, rule) => {
    if (rule.is_unavailable || rule.specific_date) return total;
    if (!rule.start_time || !rule.end_time) return total;
    const span = timeToMinutes(rule.end_time) - timeToMinutes(rule.start_time);
    return span > 0 ? total + span : total;
  }, 0);
  return minutes / 60;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * How complete a tutor's public profile is, out of 100.
 *
 * The weights are a judgement about what a student actually reads before
 * booking, not an even split. The intro video is worth the most because it is
 * the only thing on the page that shows how someone teaches; a confirmed
 * availability is worth as much as having one at all, because a stale calendar
 * produces a booking the tutor then has to cancel.
 */
export function tutorProfileScore(
  profile: TutorProfile,
  rules: AvailabilityRule[],
  now: Date = new Date()
): number {
  let score = 0;
  if (profile.profile_picture) score += PROFILE_SCORE_WEIGHTS.photo;
  if ((profile.bio || "").trim().length >= MIN_BIO_LENGTH) {
    score += PROFILE_SCORE_WEIGHTS.bio;
  }
  if ((profile.subjects || []).length > 0) score += PROFILE_SCORE_WEIGHTS.subjects;
  if ((profile.teaching_attributes || []).length >= MIN_TEACHING_ATTRIBUTES) {
    score += PROFILE_SCORE_WEIGHTS.teachingAttributes;
  }
  if (profile.intro_video_status === "approved") {
    score += PROFILE_SCORE_WEIGHTS.introVideo;
  }
  const bookableRules = rules.filter((rule) => !rule.is_unavailable);
  if (bookableRules.length > 0) score += PROFILE_SCORE_WEIGHTS.availability;
  if (isAvailabilityFresh(profile.availability_confirmed_at, now)) {
    score += PROFILE_SCORE_WEIGHTS.availabilityFresh;
  }
  return score;
}

function isAvailabilityFresh(
  confirmedAt: string | null | undefined,
  now: Date
): boolean {
  if (!confirmedAt) return false;
  const confirmed = new Date(confirmedAt).getTime();
  if (Number.isNaN(confirmed)) return false;
  const days = (now.getTime() - confirmed) / (24 * 60 * 60 * 1000);
  return days <= AVAILABILITY_FRESH_DAYS;
}

export interface TutorMetricsInput {
  profile: TutorProfile;
  availability: AvailabilityRule[];
  performance: TutorPerformance | null;
  priceInsight: TutorPriceInsight | null;
  now?: Date;
}

export function buildTutorMetrics({
  profile,
  availability,
  performance,
  priceInsight,
  now = new Date(),
}: TutorMetricsInput): TutorMetric[] {
  const hours = weeklyAvailabilityHours(availability);
  const score = tutorProfileScore(profile, availability, now);
  const replyRate = performance?.reply_rate_24h.rate ?? null;
  const priceInRange = priceInRecommendedRange(profile, priceInsight);

  return [
    {
      key: "missedLessons",
      label: "Kaçırdığın ders",
      targetLabel: "Hedef: 0",
      displayValue: performance ? String(performance.missed_lessons) : "—",
      status: !performance
        ? "unknown"
        : performance.missed_lessons === TARGETS.missedLessons
          ? "met"
          : "below",
      isLive: false,
    },
    {
      key: "replyRate",
      label: "24 saat içinde yanıt",
      targetLabel: "Hedef: %90 üzeri",
      // A tutor nobody has written to has not failed to reply.
      displayValue: replyRate === null ? "Henüz veri yok" : formatPercent(replyRate),
      status:
        replyRate === null
          ? "unknown"
          : replyRate >= TARGETS.replyRate
            ? "met"
            : "below",
      isLive: false,
    },
    {
      key: "weeklyAvailability",
      label: "Haftalık müsaitlik",
      targetLabel: `Hedef: ${TARGETS.weeklyAvailabilityHours} saat`,
      displayValue: `${formatHours(hours)} sa`,
      status: hours >= TARGETS.weeklyAvailabilityHours ? "met" : "below",
      isLive: true,
    },
    {
      key: "rating",
      label: "Değerlendirme puanı",
      targetLabel: `Hedef: ${TARGETS.rating.toFixed(1)} üzeri`,
      displayValue:
        profile.total_reviews > 0 ? profile.rating.toFixed(1) : "Henüz yorum yok",
      status:
        profile.total_reviews === 0
          ? "unknown"
          : profile.rating >= TARGETS.rating
            ? "met"
            : "below",
      isLive: true,
    },
    {
      key: "profileScore",
      label: "Profil skoru",
      targetLabel: `Hedef: ${TARGETS.profileScore} üzeri`,
      displayValue: `${score}/100`,
      status: score >= TARGETS.profileScore ? "met" : "below",
      isLive: true,
    },
    {
      key: "price",
      label: "Ders ücretin",
      // The insight object can exist and still carry no band: with too few
      // comparable tutors the API says `insufficient_data` rather than
      // guessing, and printing its nulls would put "Piyasa: null-null ₺" in
      // front of a tutor.
      targetLabel: marketRangeLabel(priceInsight),
      displayValue: `${profile.hourly_price} ₺`,
      status: priceInRange === null ? "unknown" : priceInRange ? "met" : "below",
      isLive: true,
    },
  ];
}

/**
 * Whether the tutor's price sits inside the comparable band.
 *
 * `null` when there is no band to compare against: with fewer than a handful
 * of comparable tutors the API says so rather than guessing, and a card that
 * turned that into "your price is wrong" would be inventing a verdict.
 */
function priceInRecommendedRange(
  profile: TutorProfile,
  insight: TutorPriceInsight | null
): boolean | null {
  if (!insight || insight.basis === "insufficient_data") return null;
  const { low, high } = insight.market_range;
  if (!low || !high) return null;
  return profile.hourly_price >= low && profile.hourly_price <= high;
}

function marketRangeLabel(insight: TutorPriceInsight | null): string {
  const low = insight?.market_range.low;
  const high = insight?.market_range.high;
  if (!insight || insight.basis === "insufficient_data" || !low || !high) {
    return "Karşılaştırılacak yeterli hoca yok";
  }
  return `Piyasa: ${low}-${high} ₺`;
}

function formatPercent(rate: number): string {
  return `%${Math.round(rate * 100)}`;
}

function formatHours(hours: number): string {
  // Turkish decimal separator, and no trailing ",0" on a whole number.
  return Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(1).replace(".", ",");
}

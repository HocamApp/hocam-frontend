import type { PackagePurchase } from "@/types";

/**
 * Everything the payment summary is allowed to say about a purchase, read
 * straight from the server's own record.
 *
 * The total is never recomputed from the tutor's hourly price or from the rows
 * above it: the stored `total_price` is what PayTR will be asked to collect.
 * If any amount is missing or unusable, the whole summary is refused — an
 * invented 0 ₺ next to a payment button is worse than no price at all.
 */
export interface PayTRPurchaseFacts {
  tutorName: string;
  tutorInitials: string;
  tutorAvatarUrl: string | null;
  planName: string;
  totalCredits: number;
  lessonDurationMinutes: number;
  subtotal: number;
  packageDiscount: number;
  promoDiscount: number;
  total: number;
  /** The weekly hours the purchase holds, sorted; empty when it carries none. */
  weeklySlots: PayTRWeeklySlot[];
  /** When the hold on those hours ends, in epoch milliseconds; null if none. */
  holdDeadlineMs: number | null;
}

export interface PayTRWeeklySlot {
  dayOfWeek: number;
  startTime: string;
  subjectName: string;
}

/** DRF serializes decimals as strings often enough that both shapes arrive. */
function readAmount(value: unknown): number | null {
  const amount = typeof value === "string" ? Number(value) : value;
  if (typeof amount !== "number") return null;
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

function initials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Anything malformed is dropped, never half-shown: a schedule line that reads
 * "Her undefined" next to a payment button is worse than no line. */
function readWeeklySlots(purchase: PackagePurchase): PayTRWeeklySlot[] {
  const slots = Array.isArray(purchase.recurring_slots) ? purchase.recurring_slots : [];
  return slots
    .filter(
      (slot) =>
        Number.isInteger(slot?.day_of_week) &&
        slot.day_of_week >= 0 &&
        slot.day_of_week <= 6 &&
        typeof slot.start_time === "string" &&
        TIME_PATTERN.test(slot.start_time)
    )
    .map((slot) => ({
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      subjectName: slot.subject?.name ?? "",
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

function readHoldDeadline(purchase: PackagePurchase): number | null {
  if (typeof purchase.payment_deadline !== "string") return null;
  const ms = Date.parse(purchase.payment_deadline);
  return Number.isFinite(ms) ? ms : null;
}

export function readPayTRPurchaseFacts(
  purchase: PackagePurchase | null | undefined
): PayTRPurchaseFacts | null {
  if (!purchase) return null;

  const subtotal = readAmount(purchase.subtotal_price);
  const packageDiscount = readAmount(purchase.discount_amount);
  const promoDiscount = readAmount(purchase.promo_discount_amount);
  const total = readAmount(purchase.total_price);
  const totalCredits = readAmount(purchase.total_credits);
  if (
    subtotal === null ||
    packageDiscount === null ||
    promoDiscount === null ||
    total === null ||
    totalCredits === null
  ) {
    return null;
  }

  const { tutor, plan } = purchase;
  return {
    tutorName: `${tutor.name} ${tutor.surname}`.trim(),
    tutorInitials: initials(tutor.name, tutor.surname),
    tutorAvatarUrl: tutor.profile_picture || null,
    planName: plan.name,
    totalCredits,
    lessonDurationMinutes: plan.lesson_duration_minutes,
    subtotal,
    packageDiscount,
    promoDiscount,
    total,
    weeklySlots: readWeeklySlots(purchase),
    holdDeadlineMs: purchase.status === "pending" ? readHoldDeadline(purchase) : null,
  };
}

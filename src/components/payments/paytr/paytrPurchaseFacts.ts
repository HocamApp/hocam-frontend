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
  };
}

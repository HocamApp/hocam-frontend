/**
 * The arithmetic behind the homepage's tutor earnings calculator.
 *
 * An illustration for a prospective tutor, not a payout: nothing here is
 * money that has moved. The calculator that uses it is off unless
 * NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW is "true".
 */

/** Average weeks in a month (52 / 12, rounded as the copy states it). */
export const WEEKS_PER_MONTH = 4.33;

export interface MonthlyEarnings {
  lessons: number;
  gross: number;
  commission: number;
  net: number;
}

export function monthlyEarnings(
  lessonsPerWeek: number,
  price: number,
  commissionPercent: number,
): MonthlyEarnings {
  const lessons = Math.round(lessonsPerWeek * WEEKS_PER_MONTH);
  const gross = lessons * price;
  const commission = (gross * commissionPercent) / 100;
  return { lessons, gross, commission, net: gross - commission };
}

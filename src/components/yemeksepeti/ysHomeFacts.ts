/**
 * Product facts the homepage states out loud.
 *
 * Every value here mirrors a constant the backend actually enforces. They live
 * in one place so the FAQ and the entry promo cannot drift apart, and so that
 * when a rule changes there is a single line to correct rather than a hunt
 * through prose.
 *
 * Copy interpolates these rather than retyping them: the homepage copy in
 * ysHomeCopy.ts, the FAQ, the entry promo and a few public pages.
 */

import { PAYTR_ENABLED } from "@/lib/featureFlags";
import {
  formatPlanDuration,
  PLAN_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
} from "@/lib/lessonPricing";

/** apps/lessons/pricing.py TRIAL_DURATION_MINUTES (also BookingModal.tsx). */
export const TRIAL_MINUTES = 20;

/**
 * How long tutor sign-up takes, as the homepage mockup states it. An estimate,
 * not something the code enforces; correct it if it stops being true.
 */
export const TUTOR_SIGNUP_MINUTES = 5;

/** apps/lessons/models.py MONTHLY_TRIAL_LIMIT — per student, per calendar month. */
export const MONTHLY_TRIAL_LIMIT = 3;

/** apps/lessons/pricing.py LESSON_BASE_MINUTES. The profile price is for this. */
export const LESSON_MINUTES = 40;

/**
 * Highest package discount the catalog can produce: 6 lessons/week over 180
 * days. Derived from `duration_component + (lessons_per_week - 1)` in
 * apps/payments/migrations/0019. A tutor's own override is capped lower (20%),
 * so this stays a valid upper bound in every configuration.
 */
export const MAX_PACKAGE_DISCOUNT_PERCENT = 30;

/** apps/lessons/services.py CANCELLATION_FREE_WINDOW — 12 hours. */
export const CANCELLATION_FREE_HOURS = 12;

/**
 * The highest YKS rank a tutor can register with, formatted the Turkish way
 * (period as the thousands separator).
 *
 * Enforced, not aspirational: `app/(main)/tutor/setup/page.tsx` rejects
 * anything outside 1 to 15000 with "Sıralama 1-15000 arasında olmalıdır", and
 * the input carries the same max. That is what makes "ilk 15.000" a statement
 * about the product rather than a claim about it.
 */
export const MAX_TUTOR_YKS_RANK = "15.000";

/** The weekly-lesson axis of the package matrix, lessonPricing.ts WEEKLY_LESSON_OPTIONS. */
export const LESSONS_PER_WEEK = {
  min: Math.min(...WEEKLY_LESSON_OPTIONS),
  max: Math.max(...WEEKLY_LESSON_OPTIONS),
} as const;

/**
 * The package durations, lessonPricing.ts PLAN_DURATION_DAYS, each with the
 * label checkout prints for it (formatPlanDuration).
 */
export const PLAN_DURATIONS = PLAN_DURATION_DAYS.map((days) => ({
  days,
  label: formatPlanDuration(days),
}));

/**
 * apps/lessons/models.py AUTO_CONFIRM_HOURS. After a lesson the student
 * confirms it, or it confirms itself once this many hours pass without a
 * dispute. Already quoted by /iptal-ve-iade and LessonConfirmDisputeCard.
 */
export const AUTO_CONFIRM_HOURS = 24;

/**
 * Verification document retention, as /kvkk/hoca-dogrulama publishes it ("Ne
 * kadar saklanır?"): raw documents and safe previews are deleted within this
 * many days of approval...
 */
export const VERIFICATION_DOCS_DELETE_DAYS_AFTER_APPROVAL = 7;
/** ...and rejected or pending applications keep documents at most this long. */
export const VERIFICATION_DOCS_MAX_RETENTION_DAYS = 30;

/**
 * Single paid lessons are retired: the only paid model is the weekly-lessons ×
 * duration package (docs/current-product-and-technical-state.md).
 */
export const SINGLE_LESSON_AVAILABLE = false;

/* ------------------------------------------------------------------------ *
 * Owner-decided facts.
 *
 * Everything below is a sentence or number the owners settle. A new one starts
 * as `TODO` until it is, and `scripts/check-home-facts.ts` fails the
 * production build while any are left, so a placeholder cannot ship by
 * accident. None of them are to be filled in from guesswork.
 *
 * A fact that is decided but must not show yet (payment sentences while
 * payments are off, tax text until an accountant approves it) is `null`
 * rather than `TODO`: it renders nothing and does not block the build.
 *
 * Render them through `YsFact`, which shows `[label]` for a `TODO` in
 * development and nothing in production, and nothing for `null`.
 * ------------------------------------------------------------------------ */

export const TODO: unique symbol = Symbol("TODO");
export type Todo = typeof TODO;
/** A fact that may still be undecided. */
export type Fact<T> = T | Todo;

export function isTodo(value: unknown): value is Todo {
  return value === TODO;
}

/* Answered by the owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler).
   The Turkish sentences are theirs; checked against /iptal-ve-iade (§4 no-show,
   §5 24h dispute, §9 refund formula, §11 refund within 15 days),
   /kvkk/saklama-ve-imha-politikasi (attendance records 2 yıl) and the ders
   odası FAQ (no recording). */

/**
 * Lowest and highest profile price, per 40-minute lesson. Owners, 8 Oct 2026
 * (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). The range the owners quote, not a
 * limit: the tutor profile form does not enforce it.
 */
export const PRICE_RANGE_TL: Fact<{ min: number; max: number }> = { min: 400, max: 1400 };
/**
 * Platform commission on a tutor's price. Founder decision, 8 October 2026
 * (was 15%). Mirrors apps/tutors/price_insights.py
 * TUTOR_ESTIMATED_COMMISSION_BPS = 1750 and /kullanim-kosullari §10.
 * Render it with formatPercent so it reads "17,5", not "17.5".
 */
export const COMMISSION_PERCENT: Fact<number> = 17.5;
/**
 * When the student's card is actually charged. Owners, 8 Oct 2026
 * (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). Payments are not live, so this is
 * `null` (renders nothing) unless the build has PayTR on.
 */
export const PAYMENT_CHARGED_WHEN: string | null = PAYTR_ENABLED
  ? "Hocan paket talebini onaylayınca ödeme ekranı açılır; kartından o anda çekilir."
  : null;
/**
 * When and how a tutor is paid. Owners, 8 Oct 2026
 * (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). Never IBAN, and never a promise
 * before payouts are live: `null` (renders nothing) unless PayTR is on.
 */
export const TUTOR_PAYOUT_TEXT: string | null = PAYTR_ENABLED
  ? "Ders ve koçluk kazançların haftada bir, toplu olarak aktarılır: onaylanan ve itiraz süresi geçen dersler o haftanın ödemesine girer."
  : null;
/** Whether a tutor is paid for a free trial lesson. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). */
export const TRIAL_PAID_TO_TUTOR: Fact<string> = `Hayır. ${TRIAL_MINUTES} dakikalık deneme dersi öğrenciye ücretsiz; hocaya ayrıca ödeme yapılmaz, hoca bunu gönüllü sunar.`;
/** What happens when the tutor does not show up. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler); /iptal-ve-iade §4. */
export const TUTOR_NO_SHOW_TEXT: Fact<string> =
  "Hoca derse gelmezse (15 dakika beklenir) ders iptal olur, ders hakkın paketine geri yüklenir ve sana ek bir telafi dersi hakkı tanımlanır.";
/** What happens to the remaining lessons when a student switches tutor. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler); /iptal-ve-iade §9, §11. */
export const REMAINING_ON_SWITCH_TEXT: Fact<string> =
  "Paket tek bir hocaya bağlıdır, başka hocaya aktarılmaz. Hoca değiştirmek istersen kalan dersler için iade talebi açarsın: ödediğin tutardan, kullandığın derslerin indirimli birim fiyatı düşülerek hesaplanır; kabul edilince 15 gün içinde iade edilir.";
/**
 * Whether a tutor has to accept every lesson request. Owners, 8 Oct 2026
 * (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler), describing the product as it is:
 * the tutor accepts the package request before payment, and bookings start
 * pending unless "Rezervasyonları otomatik onayla" is on.
 */
export const TUTOR_MUST_ACCEPT_TEXT: Fact<string> =
  "Evet, paket taleplerini ve yeni rezervasyonları sen onaylarsın. İstersen profilinden rezervasyonları otomatik onaylamayı açabilirsin. Müsait olmadığın saatleri takviminde kapalı tut.";
/**
 * What happens when the student does not show up. Owners, 8 Oct 2026
 * (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler); /iptal-ve-iade §4, §5. The owners'
 * "hoca dersin karşılığını alır" is left out: it is a payout statement.
 */
export const STUDENT_NO_SHOW_TEXT: Fact<string> = `Sen derse gelmezsen ve hoca gelmişse ders yapılmış sayılır ve paketinden bir ders hakkı düşer. ${AUTO_CONFIRM_HOURS} saat içinde itiraz edebilirsin.`;
/** What happens when a verification application is rejected. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). */
export const VERIFICATION_REJECTION_TEXT: Fact<string> =
  "Tekrar başvurabilirsin, bekleme süresi yok. Ret gerekçesi hesabındaki doğrulama ekranında görünür; güncel belgelerle yeni başvuru açarsın.";
/**
 * How long until a verification application is decided, as copy reads it
 * ("Başvurular X içinde sonuçlanır"). Owners, 8 Oct 2026
 * (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler).
 */
export const VERIFICATION_REVIEW_TIME: Fact<string> = "1–2 iş günü";
/** Whether lessons are recorded. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler); /kvkk/saklama-ve-imha-politikasi. */
export const RECORDING_POLICY_TEXT: Fact<string> =
  "Hayır. Derslerde ses ve görüntü kaydı alınmaz; yalnızca kimin derse ne zaman katıldığı kaydı tutulur ve 2 yıl saklanır.";
/** Whether a parent can join or watch a lesson. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). */
export const PARENT_CAN_JOIN_TEXT: Fact<string> =
  "Hayır. Derse yalnızca öğrenci ve hoca katılır; ayrı bir veli hesabı yok. 18 yaş altı öğrenciler platformu veli bilgisi ve onayıyla kullanır.";
/** Whether a parent can pay on the student's behalf. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). */
export const PARENT_CAN_PAY_TEXT: Fact<string> = "Ayrı bir veli hesabı yok; ödeme öğrencinin hesabı üzerinden yapılır.";
/** How fast support answers; copy reads "… X içinde dönüyoruz.". Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). */
export const SUPPORT_REPLY_TEXT: Fact<string> = "24 saat";
/** The rule on moving lessons or payments off the platform. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler). */
export const OFF_PLATFORM_TEXT: Fact<string> =
  "Platform dışında ders yapmak veya ödeme almak yasaktır; tespit edilirse hesap askıya alınabilir.";
/**
 * Tax obligations for tutors. Needs accountant-approved text, which does not
 * exist yet; while it is `null` the tutor FAQ leaves the question out, JSON-LD
 * included. Not `TODO`: a missing answer hides the question rather than
 * blocking the build.
 */
export const TAX_TEXT: string | null = null;
/**
 * How coaching works. Owners, 8 Oct 2026 (Hocam_Ana_Sayfa_Doldurulacak_Bilgiler).
 * Renders only while the coaching flag is on.
 */
export const COACHING_TUTOR_TEXT: Fact<string> =
  "Koçluk, öğrencinin ders paketine bağlı ek hizmettir; tek başına alınmaz. Hoca kendi koçluk planını açar: 30 dakikalık görüşmeler, çalışma programı, deneme değerlendirmesi, ilerleme raporu ve mesajlara 24 saat içinde yanıt.";

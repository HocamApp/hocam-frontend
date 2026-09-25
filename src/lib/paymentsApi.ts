/**
 * Ledger-first lesson package foundation (apps.payments on the backend).
 * No real payment provider yet: a purchase means "admin approval/payment
 * confirmation pending," not an online charge.
 */
import api from "./api";
import {
  CreatePackagePurchasePayload,
  PackagePlan,
  PackagePurchase,
  PaymentLedgerEntry,
  PromoPreviewRequest,
  PromoPreviewResponse,
  ReferralInfo,
  StartPayTRCheckoutRequest,
  StartPayTRCheckoutResponse,
  PayTRPaymentStatus,
  TutorEarningsSummary,
  TutorPackageOffer,
  UpdateTutorPackageOfferPayload,
} from "@/types";

export async function fetchPackagePlans(): Promise<PackagePlan[]> {
  const response = await api.get<PackagePlan[]>("/payments/package-plans/");
  return response.data;
}

export async function fetchPackagePurchases(): Promise<PackagePurchase[]> {
  const response = await api.get<PackagePurchase[]>("/payments/package-purchases/");
  return response.data;
}

export async function createPackagePurchase(
  payload: CreatePackagePurchasePayload
): Promise<PackagePurchase> {
  const response = await api.post<PackagePurchase>(
    "/payments/package-purchases/",
    payload
  );
  return response.data;
}

export async function previewPackagePromotion(
  payload: PromoPreviewRequest
): Promise<PromoPreviewResponse> {
  const response = await api.post<PromoPreviewResponse>(
    "/payments/package-purchases/promo-preview/",
    payload
  );
  return response.data;
}

export async function fetchPaymentHistory(): Promise<PaymentLedgerEntry[]> {
  const response = await api.get<PaymentLedgerEntry[]>("/payments/history/");
  return response.data;
}

export async function fetchReferralInfo(): Promise<ReferralInfo> {
  const response = await api.get<ReferralInfo>("/payments/referral/");
  return response.data;
}

export async function fetchTutorEarnings(): Promise<TutorEarningsSummary> {
  const response = await api.get<TutorEarningsSummary>("/payments/tutor/earnings/");
  return response.data;
}

export async function fetchTutorPackagePurchases(): Promise<PackagePurchase[]> {
  const response = await api.get<PackagePurchase[]>("/payments/tutor/package-purchases/");
  return response.data;
}

export async function fetchTutorPackageOffers(): Promise<TutorPackageOffer[]> {
  const response = await api.get<TutorPackageOffer[]>("/payments/tutor/package-offers/");
  return response.data;
}

export async function updateTutorPackageOffers(
  payload: UpdateTutorPackageOfferPayload[]
): Promise<TutorPackageOffer[]> {
  const response = await api.patch<TutorPackageOffer[]>(
    "/payments/tutor/package-offers/",
    payload
  );
  return response.data;
}

/** Public, tutor-scoped: only the plans that tutor currently offers, at
 * their effective (possibly overridden) discount. Shaped identically to
 * PackagePlan so it's a drop-in replacement for fetchPackagePlans() on any
 * screen that prices packages for one specific tutor (checkout, the offer
 * teaser on the tutor detail page). */
export async function fetchTutorOfferedPlans(tutorId: string): Promise<PackagePlan[]> {
  const response = await api.get<PackagePlan[]>(
    `/payments/tutors/${tutorId}/offered-plans/`
  );
  return response.data;
}

/** Purchasable matrix plans (lessons_per_week × duration_days). Retired
 * legacy bundles are inactive server-side, but guard anyway so an ad-hoc
 * row can never render as a broken card. */
export function filterMatrixPlans(plans: PackagePlan[] | undefined): PackagePlan[] {
  return (plans ?? []).filter(
    (p) => p.lessons_per_week != null && p.duration_days != null
  );
}

// Covers the tutor/plan validation messages, the promotion_code ones and the
// duplicate-pending guard. Matched on the fuller "promotion code ..."
// phrases, not bare "is not active", to avoid colliding with "This package
// plan is not active." sharing that substring.
export function translatePackagePurchaseError(message: string): string {
  if (message.includes("not available for package purchase"))
    return "Bu hoca şu anda paket satışına açık değil.";
  if (message.includes("This package plan is not active"))
    return "Bu paket planı artık aktif değil.";
  if (message.includes("does not currently offer this package plan"))
    return "Bu hoca şu anda bu paket planını sunmuyor.";
  if (message.includes("promotion code does not exist"))
    return "Bu indirim kodu geçerli değil.";
  if (message.includes("promotion code is not active"))
    return "Bu indirim kodu artık aktif değil.";
  if (message.includes("promotion code is not valid yet"))
    return "Bu indirim kodu henüz geçerli değil.";
  if (message.includes("promotion code has expired"))
    return "Bu indirim kodunun süresi dolmuş.";
  if (message.includes("promotion code has reached its usage limit"))
    return "Bu indirim kodu kullanım limitine ulaşmış.";
  if (message.includes("already have a pending package purchase"))
    return "Bu hoca için zaten bekleyen bir paket talebin var.";
  return message;
}

export interface RetentionOfferAcceptResult {
  promotion_code: string;
  plan_code: string;
  discount_percent: number;
  valid_until: string;
}

/**
 * Accepts the account-deletion retention offer. Idempotent server-side, so a
 * double-click or retry returns the same promotion code instead of stacking.
 */
export async function acceptRetentionOffer(): Promise<RetentionOfferAcceptResult> {
  const response = await api.post<RetentionOfferAcceptResult>(
    "/auth/retention-offer/accept/"
  );
  return response.data;
}

/** Pull the most specific error string out of a DRF error response. */
export function extractPackagePurchaseErrorMessage(err: unknown): string {
  const axErr = err as { response?: { data?: unknown } };
  const data = axErr.response?.data;
  let message = "Paket talebi oluşturulamadı. Lütfen tekrar deneyin.";
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.detail === "string") message = d.detail;
    else if (Array.isArray(d.non_field_errors) && d.non_field_errors[0])
      message = String(d.non_field_errors[0]);
    else {
      const firstKey = Object.keys(d)[0];
      const val = firstKey ? d[firstKey] : null;
      if (Array.isArray(val) && val[0]) message = String(val[0]);
      else if (typeof val === "string" && val) message = val;
    }
  }
  return translatePackagePurchaseError(message);
}

export function extractPromoPreviewErrorMessage(err: unknown): string {
  const translated = extractPackagePurchaseErrorMessage(err);
  return translated.startsWith("Paket talebi oluşturulamadı")
    ? "İndirim kodu doğrulanamadı. Lütfen tekrar deneyin."
    : translated;
}

// =========================================================================
// PayTR — hosted iframe checkout for an already-created package purchase.
//
// The browser only ever asks for a token: the amount comes from the stored
// purchase, the acceptance gate is re-checked server-side, and card, CVV, OTP
// and 3D Secure input stay inside PayTR's own iframe. Nothing here confirms a
// payment — only a purchase that the backend reports as `paid` does that.
// =========================================================================

/**
 * Opens one PayTR attempt for one purchase. Call it from a deliberate user
 * submit only: the server may resume the same active order, but the browser
 * never starts or resumes payment automatically.
 */
export async function startPayTRCheckout(
  purchaseId: string,
  payload: StartPayTRCheckoutRequest
): Promise<StartPayTRCheckoutResponse> {
  const response = await api.post<StartPayTRCheckoutResponse>(
    `/payments/package-purchases/${purchaseId}/paytr-checkout/`,
    payload
  );
  return response.data;
}

export async function fetchPayTRPaymentStatus(
  purchaseId: string
): Promise<PayTRPaymentStatus> {
  const response = await api.get<PayTRPaymentStatus>(
    `/payments/package-purchases/${purchaseId}/payment-status/`
  );
  return response.data;
}

export type PayTRCustomerField = "user_name" | "user_address" | "user_phone";

/**
 * What the caller should do next, not what went wrong on the server:
 *
 * - `field` — the form owns it; show the message beside the named input.
 * - `form`  — a 400 we cannot attribute to a field (an invalid customer IP,
 *             say). One safe line above the form; no infrastructure detail.
 * - `unavailable` — 404: not this student's purchase, or gone. No retry loop.
 * - `conflict`    — 409: local state is stale. Refetch purchase + acceptance
 *                   and render whatever the server now says.
 * - `service`     — 503: PayTR is off or misconfigured. Manual retry only,
 *                   after a state check.
 * - `unknown`     — the response was lost, so the attempt may well exist.
 *                   Check the purchase; never claim the card was not charged
 *                   and never re-POST on the user's behalf.
 */
export type PayTRCheckoutErrorKind =
  | "field"
  | "form"
  | "unavailable"
  | "conflict"
  | "service"
  | "unknown";

export interface PayTRCheckoutError {
  kind: PayTRCheckoutErrorKind;
  message: string;
  fieldErrors: Partial<Record<PayTRCustomerField, string>>;
}

const PAYTR_CUSTOMER_FIELDS: PayTRCustomerField[] = [
  "user_name",
  "user_address",
  "user_phone",
];

/** Our own copy, keyed by field. The server's English validation text is
 * never rendered, so a wording change there cannot leak into the UI. */
const PAYTR_FIELD_MESSAGES: Record<PayTRCustomerField, string> = {
  user_name: "Ad soyad gerekli.",
  user_address: "Adres gerekli.",
  user_phone: "Telefon numarası gerekli.",
};

const PAYTR_KIND_MESSAGES: Record<PayTRCheckoutErrorKind, string> = {
  field: "Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene.",
  form: "Ödeme başlatılamadı. Bilgilerini kontrol edip yeniden dene.",
  unavailable: "Paket bilgilerine erişilemiyor.",
  conflict: "Paketin güncel durumu kontrol ediliyor.",
  service: "Ödeme hizmeti şu anda kullanılamıyor.",
  unknown:
    "Ödeme sonucu doğrulanmadı. Yeniden ödeme başlatmadan durumu kontrol et.",
};

function describedError(
  kind: PayTRCheckoutErrorKind,
  fieldErrors: Partial<Record<PayTRCustomerField, string>> = {}
): PayTRCheckoutError {
  return { kind, message: PAYTR_KIND_MESSAGES[kind], fieldErrors };
}

/**
 * Classifies a failed `startPayTRCheckout` call into something the payment
 * screen can act on. Deliberately narrow: it never forwards raw server text
 * and never turns an uncertain outcome into a confirmed failure.
 */
export function describePayTRCheckoutError(err: unknown): PayTRCheckoutError {
  const status = (err as { response?: { status?: number } }).response?.status;
  if (status === 404) return describedError("unavailable");
  if (status === 409) return describedError("conflict");
  if (status === 503) return describedError("service");
  if (status !== 400) return describedError("unknown");

  const data = (err as { response?: { data?: unknown } }).response?.data;
  const fieldErrors: Partial<Record<PayTRCustomerField, string>> = {};
  if (data && typeof data === "object") {
    const body = data as Record<string, unknown>;
    for (const field of PAYTR_CUSTOMER_FIELDS) {
      if (body[field] != null) fieldErrors[field] = PAYTR_FIELD_MESSAGES[field];
    }
  }
  return Object.keys(fieldErrors).length > 0
    ? describedError("field", fieldErrors)
    : describedError("form");
}

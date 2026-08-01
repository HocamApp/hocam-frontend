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

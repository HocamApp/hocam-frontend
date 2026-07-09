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
  ReferralInfo,
  TutorEarningsSummary,
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

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

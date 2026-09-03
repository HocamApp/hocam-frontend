import type { PaymentLedgerEntry } from "@/types";

const MONETARY_PAYMENT_ENTRY_TYPES = new Set([
  "package_purchase_paid",
  "package_refund_processed",
]);

export function isMonetaryPaymentEntry(entry: PaymentLedgerEntry): boolean {
  return MONETARY_PAYMENT_ENTRY_TYPES.has(entry.entry_type) && entry.amount > 0;
}

export function isPackageCreditActivity(
  entry: PaymentLedgerEntry,
  packagePurchaseId: string
): boolean {
  return (
    entry.package_purchase === packagePurchaseId &&
    entry.credit_delta !== 0
  );
}

export function creditActivityLabel(entry: PaymentLedgerEntry): string {
  const creditCount = Math.abs(entry.credit_delta);

  switch (entry.entry_type) {
    case "package_purchase_paid":
      return `${creditCount} ders hakkı pakete tanımlandı`;
    case "lesson_credit_used":
      return `${creditCount} ders hakkı kullanıldı`;
    case "lesson_credit_refunded":
      return `${creditCount} ders hakkı geri verildi`;
    case "dispute_compensation_credit":
      return `${creditCount} telafi ders hakkı eklendi`;
    case "package_refund_processed":
      return `${creditCount} ders hakkı iade talebi kaydıyla kapatıldı`;
    default:
      return entry.credit_delta > 0
        ? `${creditCount} ders hakkı eklendi`
        : `${creditCount} ders hakkı kullanıldı`;
  }
}

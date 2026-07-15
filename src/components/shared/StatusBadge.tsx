import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BOOKING_LABELS: Record<string, string> = {
  pending: "Hoca onayı bekleniyor",
  confirmed: "Ders kesinleşti",
  in_progress: "Ders başladı",
  awaiting_confirmation: "Ders onayınızı bekliyor",
  completed: "Ders tamamlandı",
  disputed: "İnceleme devam ediyor",
  cancelled: "Ders iptal edildi",
  // Legacy backend records used "expired" for unanswered bookings. New
  // records are "cancelled", but keep the old value understandable in UI.
  expired: "Otomatik iptal edildi",
};

const LESSON_REQUEST_LABELS: Record<string, string> = {
  pending: "Beklemede",
  accepted: "Kabul Edildi",
  declined: "Reddedildi",
};

const PACKAGE_PURCHASE_LABELS: Record<string, string> = {
  pending: "İnceleme bekliyor",
  paid: "Aktif",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
};

const BOOKING_STYLES: Record<string, string> = {
  pending: "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  confirmed: "border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300",
  in_progress: "border-sky-500 text-sky-700 dark:border-sky-400 dark:text-sky-300",
  awaiting_confirmation: "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  completed: "border-green-500 text-green-700 dark:border-green-400 dark:text-green-300",
  disputed: "border-orange-500 text-orange-700 dark:border-orange-400 dark:text-orange-300",
  cancelled: "border-red-500 text-red-700 dark:border-red-400 dark:text-red-300",
  expired: "border-red-500 text-red-700 dark:border-red-400 dark:text-red-300",
};

const LESSON_REQUEST_STYLES: Record<string, string> = {
  pending: "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  accepted: "border-green-500 text-green-700 dark:border-green-400 dark:text-green-300",
  declined: "border-red-500 text-red-700 dark:border-red-400 dark:text-red-300",
};

const PACKAGE_PURCHASE_STYLES: Record<string, string> = {
  pending: "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
  paid: "border-green-500 text-green-700 dark:border-green-400 dark:text-green-300",
  cancelled: "border-red-500 text-red-700 dark:border-red-400 dark:text-red-300",
  refunded: "border-slate-500 text-slate-700 dark:border-slate-400 dark:text-slate-300",
};

const LABELS_BY_TYPE = {
  booking: BOOKING_LABELS,
  lessonRequest: LESSON_REQUEST_LABELS,
  packagePurchase: PACKAGE_PURCHASE_LABELS,
};

const STYLES_BY_TYPE = {
  booking: BOOKING_STYLES,
  lessonRequest: LESSON_REQUEST_STYLES,
  packagePurchase: PACKAGE_PURCHASE_STYLES,
};

interface StatusBadgeProps {
  status: string;
  type: "booking" | "lessonRequest" | "packagePurchase";
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase();
  const labels = LABELS_BY_TYPE[type];
  const styles = STYLES_BY_TYPE[type];
  const label = labels[normalized] ?? status ?? "";
  const style = styles[normalized] ?? "";

  return (
    <Badge variant="outline" className={cn(style)}>
      {label}
    </Badge>
  );
}

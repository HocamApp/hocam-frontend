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
  pending: "border-ink bg-ink text-paper",
  confirmed: "border-gold bg-gold text-gold-ink",
  in_progress: "border-pink bg-pink text-[var(--ink-on-light)]",
  awaiting_confirmation: "border-ink bg-ink text-paper",
  completed: "border-success bg-success-soft text-ink",
  disputed: "border-error bg-error text-destructive-foreground",
  cancelled: "border-error bg-error text-destructive-foreground",
  expired: "border-error bg-error text-destructive-foreground",
};

const LESSON_REQUEST_STYLES: Record<string, string> = {
  pending: "border-ink bg-ink text-paper",
  accepted: "border-success bg-success-soft text-ink",
  declined: "border-error bg-error text-destructive-foreground",
};

const PACKAGE_PURCHASE_STYLES: Record<string, string> = {
  pending: "border-ink bg-ink text-paper",
  paid: "border-success bg-success-soft text-ink",
  cancelled: "border-error bg-error text-destructive-foreground",
  refunded: "border-line bg-paper text-ink-mid",
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
  const style = styles[normalized] ?? "border-line bg-paper text-ink-mid";

  return (
    <Badge variant="outline" className={cn(style)}>
      {label}
    </Badge>
  );
}

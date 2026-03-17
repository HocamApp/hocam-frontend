import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BOOKING_LABELS: Record<string, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

const LESSON_REQUEST_LABELS: Record<string, string> = {
  pending: "Beklemede",
  accepted: "Kabul Edildi",
  declined: "Reddedildi",
};

const BOOKING_STYLES: Record<string, string> = {
  pending: "border-amber-500 text-amber-700",
  confirmed: "border-blue-500 text-blue-700",
  completed: "border-green-500 text-green-700",
  cancelled: "border-red-500 text-red-700",
};

const LESSON_REQUEST_STYLES: Record<string, string> = {
  pending: "border-amber-500 text-amber-700",
  accepted: "border-green-500 text-green-700",
  declined: "border-red-500 text-red-700",
};

interface StatusBadgeProps {
  status: string;
  type: "booking" | "lessonRequest";
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase();
  const labels =
    type === "booking" ? BOOKING_LABELS : LESSON_REQUEST_LABELS;
  const styles =
    type === "booking" ? BOOKING_STYLES : LESSON_REQUEST_STYLES;
  const label = labels[normalized] ?? status ?? "";
  const style = styles[normalized] ?? "";

  return (
    <Badge variant="outline" className={cn(style)}>
      {label}
    </Badge>
  );
}

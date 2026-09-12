import type { Booking } from "@/types";

/**
 * What a booking's status means, in a sentence.
 *
 * Lived in the lessons workspace, which the dashboard has absorbed. A status
 * word alone ("beklemede") answers none of the questions a student actually
 * has — whether anyone has seen the request, whether they need to do
 * something, whether it is over.
 */
const STATUS_EXPLANATIONS: Record<Booking["status"], string> = {
  pending: "Talebin hocaya iletildi. Yanıt geldiğinde bildirim alacaksın.",
  confirmed: "Ders kesinleşti. Ders odası zamanı geldiğinde buradan açılır.",
  in_progress: "Ders başladı; şimdi ders odasına katılabilirsin.",
  awaiting_confirmation: "Ders bitti. Tamamlandığını onaylaman bekleniyor.",
  completed: "Ders başarıyla tamamlandı.",
  disputed: "Bildirdiğin sorun ekip tarafından inceleniyor.",
  cancelled: "Bu rezervasyon iptal edildi.",
  expired: "Geçmişte yanıtlanmayan bu rezervasyon otomatik iptal edildi.",
};

export function bookingStatusExplanation(status: Booking["status"]): string {
  return STATUS_EXPLANATIONS[status] ?? "";
}

const STATUS_LABELS: Record<Booking["status"], string> = {
  pending: "Hoca onayı bekleniyor",
  confirmed: "Ders kesinleşti",
  in_progress: "Ders başladı",
  awaiting_confirmation: "Onayını bekliyor",
  completed: "Tamamlandı",
  disputed: "İnceleniyor",
  cancelled: "İptal edildi",
  // Legacy backend records used "expired" for unanswered bookings; new ones
  // are "cancelled", but old rows still have to read as something.
  expired: "Otomatik iptal edildi",
};

export function bookingStatusLabel(status: Booking["status"]): string {
  return STATUS_LABELS[status] ?? "";
}

/** Statuses whose chip should carry attention rather than sit quiet. */
const ATTENTION_STATUSES = new Set<Booking["status"]>([
  "pending",
  "awaiting_confirmation",
  "disputed",
]);

export function isAttentionStatus(status: Booking["status"]): boolean {
  return ATTENTION_STATUSES.has(status);
}

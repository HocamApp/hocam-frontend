import type {
  AcceptanceDecisionStatus,
  PayTRBlockedReason,
  PayTRCheckoutStateName,
} from "./paytrCheckoutState";

/**
 * The approved Turkish wording for every state the mapper can return.
 *
 * Copy lives here rather than inside each screen so the same state cannot say
 * two different things on the payment page and on a return page. Two rules it
 * enforces by construction:
 *
 * - "success" is reserved for a purchase the backend already calls paid.
 * - An unresolved result never claims the card was or was not charged, and
 *   never offers a fresh payment; it offers a re-check.
 */

export type PayTRCopyTone = "neutral" | "busy" | "success" | "error";

/** What the screen should offer next. The screens own the wiring; this only
 * says which kind of action belongs to the state. */
export type PayTRCopyAction = "none" | "form" | "packages" | "recheck" | "retry";

export interface PayTRStateCopy {
  title: string;
  description: string;
  tone: PayTRCopyTone;
  action: PayTRCopyAction;
}

export interface PayTRStateCopyInput {
  name: PayTRCheckoutStateName;
  acceptanceStatus?: AcceptanceDecisionStatus;
  blockedReason?: PayTRBlockedReason;
}

const ACCEPTANCE_ENDED_TITLES: Record<string, string> = {
  rejected: "Paket talebi kabul edilmedi",
  expired: "Talebin süresi doldu",
  withdrawn: "Paket talebi kapatıldı",
  cancelled: "Paket talebi kapatıldı",
};

const BASE: Record<PayTRCheckoutStateName, PayTRStateCopy> = {
  loading: {
    title: "Paket bilgileri yükleniyor",
    description: "Ödeme için gereken bilgiler hazırlanıyor.",
    tone: "busy",
    action: "none",
  },
  query_error: {
    title: "Paket bilgileri alınamadı",
    description: "Bağlantını kontrol edip yeniden deneyebilirsin.",
    tone: "error",
    action: "recheck",
  },
  purchase_unavailable: {
    title: "Paket görüntülenemiyor",
    description: "Paket bilgilerine erişilemiyor.",
    tone: "error",
    action: "packages",
  },
  acceptance_pending: {
    title: "Hoca onayı bekleniyor",
    description: "Hoca talebini onayladığında ödeme adımına geçebilirsin.",
    tone: "neutral",
    action: "packages",
  },
  acceptance_rejected: {
    title: "Paket talebi kapatıldı",
    description: "Bu talep için ödeme başlatılamaz.",
    tone: "neutral",
    action: "packages",
  },
  payment_unavailable: {
    title: "Ödeme şu anda kullanılamıyor",
    description: "Bu paket için ödeme girişi şu anda kapalı.",
    tone: "neutral",
    action: "packages",
  },
  payment_ready: {
    title: "Ödeme için gereken bilgiler",
    description: "Bilgilerini gir, ardından güvenli ödeme ekranına geç.",
    tone: "neutral",
    action: "form",
  },
  payment_resume: {
    title: "Ödemeye devam et",
    description: "Açık ödeme girişimine devam etmek için bilgilerini gir.",
    tone: "neutral",
    action: "form",
  },
  starting_payment: {
    title: "Ödeme ekranı hazırlanıyor…",
    description: "Güvenli ödeme formu açılıyor.",
    tone: "busy",
    action: "none",
  },
  iframe_open: {
    title: "Kartla ödeme",
    description: "Kart bilgilerini PayTR ekranında gir.",
    tone: "neutral",
    action: "none",
  },
  callback_pending: {
    title: "Ödeme sonucu doğrulanıyor",
    description:
      "Sonuç henüz kesinleşmedi. Yeniden ödeme başlatmadan durumu kontrol et.",
    tone: "busy",
    action: "recheck",
  },
  attempt_failed: {
    title: "Ödeme tamamlanamadı",
    description: "Bu ödeme girişimi tamamlanamadı.",
    tone: "error",
    action: "retry",
  },
  manual_review: {
    title: "Ödeme inceleniyor",
    description:
      "Sonuç kontrol ediliyor. Bu paket için yeniden ödeme başlatma, durumu kontrol et.",
    tone: "neutral",
    action: "recheck",
  },
  payment_paid: {
    title: "Ödemen onaylandı",
    description: "Paketinin güncel durumunu Paketlerim'de görebilirsin.",
    tone: "success",
    action: "packages",
  },
  purchase_cancelled: {
    title: "Paket iptal edildi",
    description: "Bu paket için ödeme başlatılamaz.",
    tone: "neutral",
    action: "packages",
  },
  purchase_refunded: {
    title: "Paket iade durumunda",
    description:
      "Paket kaydı iade durumunda. Güncel bilgileri Paketlerim'den kontrol edebilirsin.",
    tone: "neutral",
    action: "packages",
  },
};

export function payTRStateCopy(input: PayTRStateCopyInput): PayTRStateCopy {
  const copy = BASE[input.name];

  if (input.name === "acceptance_rejected" && input.acceptanceStatus) {
    const title = ACCEPTANCE_ENDED_TITLES[input.acceptanceStatus];
    if (title) return { ...copy, title };
  }

  if (
    input.name === "payment_unavailable" &&
    input.blockedReason === "coaching_unverified"
  ) {
    return {
      ...copy,
      title: "Bu paket için ödeme henüz kullanılamıyor",
      description:
        "Koçluk içeren paketlerde ödeme henüz açılmadı. Paket seçimin olduğu gibi duruyor.",
    };
  }

  return copy;
}

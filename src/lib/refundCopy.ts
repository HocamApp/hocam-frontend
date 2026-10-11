/**
 * Every sentence of the refund screens, in one place.
 *
 * DESIGN.md §9 applies: "sen", no emoji, no em dash, no exclamation mark, and
 * a message says what happened and then what to do. Amounts are written by
 * `formatPrice` (4.320 ₺, symbol after the number).
 *
 * The server's own text is never shown. Its codes pick a sentence from here, so
 * a wording change on the API cannot change what a student reads about their
 * money.
 */
import type {
  RefundBlockedReason,
  RefundReason,
  RefundRequestReason,
  RefundStatus,
} from "@/types";
import type { RefundErrorKind } from "./refundsApi";

export interface RefundReasonOption {
  value: RefundReason;
  label: string;
  hint: string;
}

/** The reasons offered to everyone, in the order they are shown. */
export const REFUND_REASON_OPTIONS: readonly RefundReasonOption[] = [
  {
    value: "voluntary",
    label: "Paketten vazgeçtim",
    hint: "Kişisel bir nedenle devam etmek istemiyorum.",
  },
  {
    value: "tutor_issue",
    label: "Hocayla ilgili bir sorun var",
    hint: "Dersler yapılmadı, hocaya ulaşamıyorum ya da ders düzenli ilerlemiyor.",
  },
  {
    value: "technical",
    label: "Teknik bir sorun yaşadım",
    hint: "Ders odası açılmadı, bağlantı koptu ya da paket bilgilerim yanlış görünüyor.",
  },
  {
    value: "other",
    label: "Başka bir neden",
    hint: "Nedenini aşağıdaki nota yaz.",
  },
];

/** Only offered for a package that had hours it could not schedule when it was
 * paid; the screen shows it when it is asked for by link, and the server
 * refuses it for any other package. */
export const SLOT_CONFLICT_OPTION: RefundReasonOption = {
  value: "slot_conflict",
  label: "Seçtiğim saatler doldu",
  hint: "Ödeme sırasında seçtiğim saatler başkasına geçti ve uygun başka bir saat bulamadım.",
};

const REQUEST_REASON_LABELS: Record<RefundRequestReason, string> = {
  voluntary: "Paketten vazgeçtim",
  tutor_issue: "Hocayla ilgili bir sorun var",
  technical: "Teknik bir sorun yaşadım",
  other: "Başka bir neden",
  slot_conflict: "Seçtiğim saatler doldu",
  plan_expired_leftover: "Paket süresi doldu, kullanılmayan dersler kaldı",
  tutor_left: "Hoca platformdan ayrıldı",
  verification_revoked: "Hocanın doğrulaması kaldırıldı",
  service_failure: "Hizmetten kaynaklanan bir sorun",
};

export function refundReasonLabel(reason: string): string {
  return REQUEST_REASON_LABELS[reason as RefundRequestReason] ?? "Belirtilmedi";
}

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  requested: "İnceleniyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  processed: "İade edildi",
};

export function refundStatusLabel(status: string): string {
  return REFUND_STATUS_LABEL[status as RefundStatus] ?? status;
}

export const REFUND_PAGES = {
  newTitle: "İade talebi",
  newDescription:
    "Önce nedenini seç. Sonraki adımda iade tutarını ve etkilenecek dersleri görürsün. Talebi sen onaylamadan hiçbir şey değişmez.",
  statusTitle: "İade talebin",
  statusDescription: "Talebinin hangi aşamada olduğunu buradan takip edebilirsin.",
  backToPackages: "Paketlerime dön",
  packageNotFoundTitle: "Paket bulunamadı",
  packageNotFoundDescription:
    "Bu paket hesabında görünmüyor. Paketlerim sayfasından iade istediğin paketi seçebilirsin.",
  requestNotFoundTitle: "İade talebi bulunamadı",
  requestNotFoundDescription:
    "Bu talep hesabında görünmüyor. Paketlerim sayfasından taleplerine ulaşabilirsin.",
  loadFailed: "İade talebi yüklenemedi. Sayfayı yenileyip tekrar dene.",
  packagesLoadFailed: "Paket bilgilerin yüklenemedi. Sayfayı yenileyip tekrar dene.",
  openRequestTitle: "Bu paket için açık bir iade talebin var",
  openRequestBody:
    "Talebin sonuçlanana kadar yeni bir talep açamazsın. Durumunu talep sayfasından takip edebilirsin.",
  submitted: "İade talebin alındı.",
} as const;

export const REFUND_REASON_STEP = {
  reasonLegend: "İade nedenin",
  noteLabel: "Eklemek istediğin bir not var mı?",
  noteOptional: "İsteğe bağlı",
  noteHelp: "Destek ekibimiz talebini incelerken bu notu okur.",
  next: "Devam et",
  loading: "Hesaplanıyor",
  cancel: "Vazgeç",
  yourPackage: "Paketin",
  paid: "Ödediğin tutar",
  lessons: "Toplam ders",
} as const;

export const REFUND_PREVIEW_STEP = {
  title: "İade önizlemesi",
  paid: "Ödediğin tutar",
  deduction: "Kullanılmış dersler",
  refund: "İade edilecek tutar",
  fullRefund:
    "Henüz hiçbir ders kullanılmadığı için ödediğin tutarın tamamı iade edilir.",
  unscheduledNote: "Takvime yerleştirilmemiş ders haklarının karşılığı da iade tutarına dahil.",
  usedTitle: "Kullanılmış sayılacak dersler",
  cancelledTitle: "İptal edilecek dersler",
  cancelledNote: "Talebin onaylanırsa bu dersler iptal edilir.",
  nothingCancelled: "İptal edilecek planlı ders yok.",
  whatHappensTitle: "Talebi gönderince ne olur",
  confirmLead: "İade talebini gönderdiğinde yukarıdaki tutarı onaylamış olursun.",
  submit: "İade talebini gönder",
  submitting: "Gönderiliyor",
  back: "Geri dön",
  refreshed:
    "İade tutarın değişti. Yukarıdaki yeni tutarı kontrol edip yeniden onayla.",
} as const;

export function answerWithinSentence(days: number): string {
  return days > 0
    ? `Destek ekibimiz talebine en geç ${days} gün içinde yanıt verir.`
    : "Destek ekibimiz talebine en kısa sürede yanıt verir.";
}

export function previewValiditySentence(minutes: number): string {
  return `Bu önizleme ${minutes} dakika geçerli.`;
}

/** What happens after the request, in the order it happens. Shown on the
 * preview step; `faultNote` only for the reasons staff can find in the
 * student's favour. */
export function whatHappensNext(answerWithinDays: number, reason: RefundReason): string[] {
  const lines = [
    "Talebi göndermen hiçbir dersi iptal etmez. Destek ekibimiz talebi onaylarsa yukarıda listelenen dersler iptal edilir.",
    "Karar verilene kadar planlı derslerin devam eder. O arada yapılan dersler kullanılmış sayılır ve tutar yeniden hesaplanır.",
    "Talep açıkken bu paketle yeni ders alamazsın.",
    answerWithinSentence(answerWithinDays),
    "Onaylanan iade ödeme yöntemine gönderilir. Tutarın hesabına yansıma süresi bankana göre değişir.",
  ];
  if (reason === "tutor_issue" || reason === "technical") {
    lines.splice(
      1,
      0,
      "Nedenin destek ekibine iletilir. Sorun hocadan ya da platformdan kaynaklı bulunursa tutar sana göre yeniden hesaplanır."
    );
  }
  return lines;
}

export function deductionExplanation(usedCredits: number, unitPrice: string): string {
  return `${usedCredits} ders × ${unitPrice}`;
}

export function unscheduledSentence(credits: number): string {
  return `Takvime yerleştirilmemiş ${credits} ders hakkın iade kapsamında.`;
}

export function usedLessonNote(why: string, nearWindowHours: number): string {
  switch (why) {
    case "lesson_taken":
      return "Ders yapıldı";
    case "cancelled_late":
      return "Geç iptal edildi, kullanılmış sayılır";
    case "confirmed_and_due":
      return "Ders saati geldi, kullanılmış sayılır";
    case "starts_within_the_window":
      return `Başlamasına ${nearWindowHours} saatten az kaldı, kullanılmış sayılır`;
    default:
      return "Kullanılmış sayılır";
  }
}

const BLOCKED_TEXT: Record<RefundBlockedReason, string> = {
  already_refunded: "Bu paketin ücreti zaten iade edildi.",
  not_paid: "Bu paket ödenmediği için iade istenemiyor.",
  refund_in_progress: "Bu paket için açık bir iade talebin var.",
  reason_not_applicable:
    "Seçtiğin neden bu paket için geçerli değil. Başka bir neden seçebilirsin.",
  nothing_to_refund:
    "Bu pakette iade edilecek tutar kalmadı, çünkü kullanılmış dersler ödediğin tutarı karşılıyor.",
};

export function blockedReasonText(code: string): string {
  return (
    BLOCKED_TEXT[code as RefundBlockedReason] ??
    "Bu paket için şu anda iade istenemiyor."
  );
}

export const OPEN_REQUEST_LINK = "Talebini gör";

/** The two moments an error can happen in the flow, because the right next
 * step differs: a preview can simply be asked for again, while a lost answer to
 * the request itself may have created it. */
export type RefundErrorMoment = "preview" | "submit";

export function refundErrorText(kind: RefundErrorKind, moment: RefundErrorMoment): string {
  switch (kind) {
    case "changed":
      return REFUND_PREVIEW_STEP.refreshed;
    case "in_progress":
      return "Bu paket için zaten açık bir iade talebin var.";
    case "blocked":
      return "Bu paket için şu anda iade istenemiyor.";
    case "token":
      return "Önizlemenin süresi doldu. Tutarı yenileyip yeniden onayla.";
    case "invalid":
      return "Seçtiğin neden geçerli değil. Başka bir neden seç.";
    case "unavailable":
      return "Bu paketin iade bilgisine ulaşılamadı. Sayfayı yenileyip tekrar dene.";
    case "throttled":
      return "Kısa sürede çok fazla deneme yaptın. Birkaç dakika bekleyip tekrar dene.";
    default:
      return moment === "preview"
        ? "İade tutarı hesaplanamadı. Bağlantını kontrol edip tekrar dene."
        : "İade talebinin gönderilip gönderilmediğini doğrulayamadık. Yeniden göndermeden önce Ödemeler sayfasında iade taleplerine bak.";
  }
}

export const REFUND_ENTRY = {
  lead: "Paketi kullanmaktan vazgeçtiysen ya da bir sorun yaşadıysan iade talebi oluşturabilirsin.",
  ask: "İade talep et",
  openLead: (statusLabel: string) => `Bu paket için bir iade talebin var: ${statusLabel}.`,
} as const;

export const REFUND_LIST = {
  title: "İade taleplerin",
  description: "Paketlerin için açtığın iade taleplerini ve durumlarını burada görürsün.",
  open: "Talebi aç",
} as const;

export const REFUND_STATUS_VIEW = {
  summaryTitle: "Özet",
  tutor: "Hoca",
  reason: "Neden",
  requestedAt: "Talep tarihi",
  note: "Notun",
  timelineTitle: "Süreç",
  paid: "Ödediğin tutar",
  deduction: "Kullanılmış dersler",
  refund: "İade tutarı",
  refundAsked: "Talep ettiğin iade tutarı",
  mayChange: "Tutar, karar verilene kadar yapılan derslere göre değişebilir.",
  platformOpened: "Bu talebi senin adına biz açtık.",
  rejectedTitle: "Talebin kabul edilmedi",
  rejectedReason: "Gerekçe",
  rejectedNext:
    "Paketin ve derslerin olduğu gibi devam ediyor. Gerekçeyle ilgili bir sorun varsa destek ekibine yazabilirsin.",
  support: "Destek ekibine yaz",
  usedTitle: "Kullanılmış sayılan dersler",
  cancelledTitleOpen: "İptal edilecek dersler",
  cancelledTitleDone: "İptal edilen dersler",
  oldRequestNote: "Bu talep, hesaplama dökümü saklanmadan önce oluşturulmuştu.",
} as const;

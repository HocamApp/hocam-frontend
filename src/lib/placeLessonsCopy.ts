import { PlaceLessonsFailure } from "./placeLessonsApi";
import type { PlaceLessonsResult } from "@/types";

export const PLACE_PAGES = {
  title: "Ders haklarını yerleştir",
  description: "Takvimine yerleşmemiş ders haklarını hocanın boş saatlerine ekle.",
  packageNotFoundTitle: "Paket bulunamadı",
  packageNotFoundDescription: "Bu bağlantıdaki paket sende görünmüyor ya da artık yerleştirilecek hakkı yok.",
  packagesLoadFailed: "Paketlerin yüklenemedi. Lütfen tekrar dene.",
  backToPackages: "Paketlerime dön",
  noWeeklyPlan: "Bu paket haftalık ders programı içermiyor; haklarını ders ders ayırtabilirsin.",
} as const;

export const PLACE_ENTRY = {
  lead: (credits: number) =>
    `Takvimine yerleşmemiş ${credits} ders hakkın var. Haftalık saatlerini seçip tek seferde ekleyebilirsin.`,
  action: "Hakları yerleştir",
} as const;

export const PLACE_FLOW = {
  hoursHeading: "Haftalık saatlerin",
  rule:
    "Seçtiğin saatler her hafta tekrar eder. Dersler en erken 24 saat sonrasından başlar ve paket süresi bittikten sonrasına eklenmez.",
  priceLabel: "Ek ücret yok · paket hakkın kullanılır",
  submit: "Hakları yerleştir",
  submitting: "Yerleştiriliyor…",
  needSubject: "Önce ders konusunu seç.",
  needHours: "En az bir haftalık saat seç.",
  summary: (credits: number) =>
    `${credits} ders hakkın seçtiğin saatlere sırayla yerleşecek.`,
} as const;

/**
 * What a paid purchase puts on the calendar. After payment `remaining_credits`
 * is only the credits no lesson sits on, so the lessons already planned are
 * the rest of `total_credits`.
 */
export function paidPurchaseLine(purchase: {
  total_credits: number;
  remaining_credits: number;
}): string {
  const unplaced = Math.max(0, purchase.remaining_credits);
  const planned = Math.max(0, purchase.total_credits - unplaced);
  if (planned === 0) {
    return `${unplaced} ders hakkın hazır; henüz bir saate yerleşmedi.`;
  }
  const line = `${planned} dersin takvimine eklendi.`;
  return unplaced > 0 ? `${line} ${unplaced} ders hakkın henüz bir saate yerleşmedi.` : line;
}

export function placedSummary(result: PlaceLessonsResult): string[] {
  const lines: string[] = [];
  if (result.placed > 0) {
    lines.push(`${result.placed} ders takvimine eklendi.`);
  } else {
    lines.push("Yerleştirilecek ders kalmadı; takviminde değişiklik yapılmadı.");
  }
  if (result.skipped_after_term > 0) {
    lines.push(
      `${result.skipped_after_term} hakkın paket süresine sığmadığı için yerleşmedi. Hakların duruyor; daha sık bir haftalık program seçerek bunları da ekleyebilirsin.`
    );
  }
  if (result.not_stored > 0) {
    lines.push(
      `${result.not_stored} ders kaydedilemedi, hakları duruyor. Biraz sonra tekrar dene.`
    );
  }
  if (result.remaining_credits === 0 && result.placed > 0) {
    lines.push("Bütün haklarını yerleştirdin.");
  } else if (result.remaining_credits > 0) {
    lines.push(`Yerleşmemiş ${result.remaining_credits} ders hakkın kaldı.`);
  }
  return lines;
}

/** What to tell the student for a refused placing call. */
export function placeFailureMessage(failure: PlaceLessonsFailure): string {
  switch (failure.code) {
    case "schedule_unavailable":
    case "schedule_taken":
      return failure.date
        ? `Seçtiğin saatlerden biri ${failure.date} tarihinde müsait değil. Saatleri güncelleyip tekrar dene; hiçbir ders eklenmedi.`
        : "Seçtiğin saatlerden biri artık müsait değil. Saatleri güncelleyip tekrar dene; hiçbir ders eklenmedi.";
    case "schedule_count_mismatch":
      return "Haftalık saat sayısı bu paket için uygun değil. Paketin haftalık ders sayısından fazla saat seçemezsin.";
    case "schedule_overlap":
      return "Seçtiğin saatler birbiriyle çakışıyor. Aralarında en az 50 dakika olmalı.";
    case "schedule_subject_required":
    case "schedule_subject_invalid":
      return "Ders konusunu seç.";
    case "package_not_usable":
      return "Bu paket şu an kullanılamıyor. Açık bir iade talebin ya da süresi dolmuş bir paketin olabilir.";
    default:
      return "Dersler yerleştirilemedi. Lütfen tekrar dene.";
  }
}

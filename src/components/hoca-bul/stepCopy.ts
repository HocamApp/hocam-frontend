import type { HocaBulStepId } from "@/types/hocaBul";

/**
 * Approved shell copy for every step. Kept apart from the components so the
 * question screens built in the next phase reuse the exact same strings.
 */
export interface StepCopy {
  title: string;
  helper: string;
}

export const STEP_COPY: Record<HocaBulStepId, StepCopy> = {
  hedef: {
    title: "Hangi sınava hazırlanıyorsun?",
    helper: "Hocaları buna göre süzeceğiz.",
  },
  asama: {
    title: "Şu an hangi aşamadasın?",
    helper: "Hoca, sana nereden başlayacağını buna göre planlar.",
  },
  yks_alan: {
    title: "YKS’de neye ağırlık vereceksin?",
    helper: "Birden fazla seçebilirsin.",
  },
  dersler: {
    title: "Hangi derslerde desteğe ihtiyacın var?",
    helper: "En fazla 3 ders seç.",
  },
  zorluk: {
    title: "Şu an seni en çok ne zorluyor?",
    helper: "En fazla 2 tane seç.",
  },
  hoca_yaklasimi: {
    title: "Nasıl bir hoca sana daha iyi gelir?",
    helper: "En fazla 2 tane seç.",
  },
  uygun_zamanlar: {
    title: "Dersleri genellikle ne zaman yapabilirsin?",
    helper: "Birden fazla seçebilirsin.",
  },
  butce: {
    title: "Ders başına bütçen ne kadar?",
    helper: "Fiyatlar 40 dakikalık ders içindir.",
  },
  kontrol: {
    title: "Yanıtlarını kontrol et",
    helper: "Her bölümü ayrı ayrı düzenleyebilirsin.",
  },
};

/** Short section labels used by the resume dialog. */
export const STEP_SHORT_LABEL: Record<HocaBulStepId, string> = {
  hedef: "Hedef",
  asama: "Aşama",
  yks_alan: "YKS alanı",
  dersler: "Dersler",
  zorluk: "Zorlandığın alanlar",
  hoca_yaklasimi: "Hoca yaklaşımı",
  uygun_zamanlar: "Uygun zamanlar",
  butce: "Bütçe",
  kontrol: "Kontrol",
};

export const VALIDATION_COPY = {
  required: "Devam etmek için bir seçenek seç.",
  max_exceeded: "Seçim sınırını aştın.",
  flexible_conflict:
    "Esnek program diğer zaman aralıklarıyla birlikte seçilemez.",
  stale_options: "Bu seçenek artık kullanılamıyor, lütfen yeniden seç.",
} as const;

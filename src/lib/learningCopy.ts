import type { LearningGoalTemplate, LearningLevel } from "@/types";
import { formatLevel } from "@/lib/learning";

/**
 * Curated "why choose this package" copy for the known seed packages.
 * Unknown slugs fall back to a generated paragraph so future backend
 * templates never render an empty section.
 */
const PACKAGE_WHY_COPY: Record<string, string> = {
  "tyt-matematik-temelleri":
    "TYT matematiğin yarısından fazlası temel kavram, sayı ve problem sorularından gelir. Bu paket, konu eksiklerini sıfırdan kapatarak deneme netlerinin en hızlı yükseldiği bölgeyi hedefler. Her aşama hoca onaylı derslerle ilerlediği için nerede olduğunu her zaman bilirsin.",
  "ayt-matematik-integral":
    "İntegral, AYT matematiğin en çok çekinilen ama doğru sırayla çalışıldığında en çok net getiren konularından biridir. Bu paket, integrali temel mantıktan alan problemlerine kadar kademeli olarak kurar ve her adımı birebir derslerle pekiştirir.",
  "lgs-matematik-temelleri":
    "LGS matematiğinde fark yaratan şey, temel kazanımların eksiksiz oturmasıdır. Bu paket çarpanlardan veri analizine, sınavın en çok soru getiren temel konularını planlı bir yol haritasına dönüştürür.",
  "kpss-genel-yetenek-matematik":
    "KPSS Genel Yetenek'te matematik, sıralamayı belirleyen ana bölümdür. Bu paket, temel işlem becerisinden problem tiplerine uzanan yoğun bir tekrar planıyla sınırlı zamanda en yüksek verimi almanı sağlar.",
  "tyt-problemler-kampi":
    "Problemler, TYT matematiğin tek başına en büyük soru grubudur ve tamamen tip öğrenmeye dayanır. Bu kamp, her problem tipini ayrı bir aşamada çalıştırarak 'soruyu görünce tanıma' refleksini kazandırır. Net artışını en hızlı burada hissedersin.",
  "tyt-geometri-baslangic":
    "Geometri, TYT'de birçok öğrencinin boş bıraktığı ama temelleri kurulduğunda en istikrarlı net getiren alandır. Bu paket açılardan çembere doğal bir sırayla ilerler; her aşama bir öncekinin üzerine inşa edilir.",
  "ayt-turev-limit":
    "Limit ve türev, AYT'nin en çok soru getiren analiz zinciridir ve kavramsal boşluk kaldırmaz. Bu paket, zinciri doğru sırayla kurar: önce limit mantığı, sonra türev kuralları, en sonunda yorum ve optimizasyon soruları.",
  "ayt-fonksiyonlar-polinomlar":
    "Fonksiyonlar ve polinomlar, AYT matematiğin neredeyse her sorusunun içinden geçtiği omurgadır. Bu temel sağlam değilse ileri konular da sallanır. Paket, omurgayı birebir derslerle sağlamlaştırarak sonraki konulara zemin hazırlar.",
  "ayt-trigonometri":
    "Trigonometri formül ezberiyle değil, birim çemberi gerçekten anlamakla çözülür. Bu paket kavrayış odaklı ilerler: önce çember ve oranlar, sonra grafikler, formüller ve denklemler. Böylece formüller ezber değil sonuç olur.",
  "yks-deneme-analizi-strateji":
    "Aynı bilgiyle daha fazla net yapmak mümkündür — fark, deneme rutini ve hata analizinde gizlidir. Bu mentorluk paketi, denemelerini sistemli analize çevirir, eksik konularını tespit eder ve sınav günü stratejini bir hocayla birlikte kurmanı sağlar.",
  "dgs-matematik-hizli-hazirlik":
    "DGS'ye çalışan çoğu aday sınırlı zamanla yarışır. Bu paket, sayısal bölümün tamamını hızlandırılmış bir tekrar planına sıkıştırır: temel aritmetikten sayısal mantığa, her aşama doğrudan sınav sorusuna odaklanır.",
  "tyt-paragraf-turkce-net-artirma":
    "TYT Türkçe'de netler bilgiden çok doğru okuma alışkanlığından gelir. Bu paket paragrafta hız ve doğruluğu birlikte çalıştırır, kritik dil bilgisi konularını da ekleyerek Türkçe netini istikrarlı biçimde yukarı taşır.",
};

export function getWhyChooseCopy(template: LearningGoalTemplate): string {
  const curated = PACKAGE_WHY_COPY[template.slug];
  if (curated) return curated;

  return `Bu paket, ${template.exam_type} ${template.subject_name} hazırlığında ${formatLevel(
    template.level
  ).toLowerCase()} seviyesindeki öğrenciler için adım adım ilerleyen bir yol haritası sunar. Her aşama hoca onaylı derslerle tamamlanır; böylece ilerlemen tahmine değil gerçek derslere dayanır.`;
}

/** Real package content: milestone titles in road order. */
export function getLearningOutcomes(template: LearningGoalTemplate): string[] {
  return [...template.milestone_templates]
    .sort((a, b) => a.order - b.order)
    .map((milestone) => milestone.title);
}

/** "Hedef kazanımlar" bullets, generated from the package's exam/subject. */
export function getGoalOutcomes(template: LearningGoalTemplate): string[] {
  return [
    `${template.exam_type} ${template.subject_name} sorularında hız ve doğruluk kazan`,
    "Aşama aşama ilerleyen, takip edilebilir bir çalışma planı kur",
    "Hoca onaylı derslerle ölçülebilir ilerleme elde et",
    "Eksik konularını görünür kılıp hedefli şekilde kapat",
  ];
}

export function getPrerequisites(level: LearningLevel): string[] {
  switch (level) {
    case "beginner":
      return [
        "Ön koşul yok — sıfırdan başlayabilirsin",
        "Düzenli ilerleme için haftada 2-3 saat ayırman yeterli",
      ];
    case "advanced":
      return [
        "İlgili temel ve orta seviye konulara hakimiyet",
        "Düzenli soru çözme alışkanlığı",
      ];
    case "intermediate":
    default:
      return [
        "Temel konu bilgisi",
        "Konu eksiklerini kapatma isteği ve düzenli çalışma",
      ];
  }
}

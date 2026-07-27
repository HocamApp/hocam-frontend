/**
 * Static showcase content for the authenticated student home.
 *
 * This is deliberately mock/placeholder data. The homepage redesign needs a
 * full editorial rhythm (hero slider, discovery rails, goal storytelling)
 * before the backend has endpoints for any of it. Every `href` here points at
 * a route that really exists, so the composition is navigable even though the
 * copy and the counts are placeholders.
 *
 * Replace section by section as real endpoints land.
 */

import type { HomeVisualTone } from "@/components/home/HomeVisual";
import type { HomeHeroScene } from "@/components/home/HomeHeroArt";
import type { HomeScene } from "@/components/home/HomeSceneArt";

/** Illustrated artwork pairing used by the discovery and goal cards. */
export interface HomeArtwork {
  scene: HomeScene;
  tone: HomeVisualTone;
}

export interface HomeHeroSlideContent {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  scene: HomeHeroScene;
  tone: HomeVisualTone;
}

export const HOME_HERO_SLIDES: HomeHeroSlideContent[] = [
  {
    id: "yks",
    eyebrow: "YKS hazırlık",
    title: "YKS'ye hazırlanırken doğru hocayı bul",
    description:
      "Dersine, hedefine ve bütçene uygun doğrulanmış hocaları karşılaştır; ilk dersini bu hafta planla.",
    ctaLabel: "Hocaları keşfet",
    ctaHref: "/tutors",
    scene: "study",
    tone: "brand",
  },
  {
    id: "kpss",
    eyebrow: "KPSS",
    title: "KPSS için sana uygun mentorlarla çalış",
    description:
      "Genel yetenek ve genel kültürde eksiklerini birlikte kapat, deneme sonuçlarını haftalık takip et.",
    ctaLabel: "KPSS hocalarına bak",
    ctaHref: "/tutors?exam_type=KPSS",
    scene: "exam",
    tone: "sky",
  },
  {
    id: "dgs",
    eyebrow: "DGS",
    title: "DGS sürecini planlı ilerlet",
    description:
      "Sayısal ve sözel mantık konularını sıraya koy, çalışma planını hocanla birlikte oluştur.",
    ctaLabel: "DGS hocalarına bak",
    ctaHref: "/tutors?exam_type=DGS",
    scene: "plan",
    tone: "violet",
  },
  {
    id: "questions",
    eyebrow: "Çıkmış sorular",
    title: "Çıkmış sorular ve özel dersle birlikte ilerle",
    description:
      "Yıl, ders ve konuya göre filtrelediğin soruları çöz; yanlışlarını hocanla aynı ekranda konuş.",
    ctaLabel: "Soruları aç",
    ctaHref: "/cikmis-sorular",
    scene: "questions",
    tone: "cream",
  },
];

export interface HomeExploreCardContent {
  id: string;
  title: string;
  description: string;
  href: string;
  artwork: HomeArtwork;
}

export const HOME_EXPLORE_CARDS: HomeExploreCardContent[] = [
  {
    id: "tyt-matematik",
    title: "TYT Matematik",
    description: "Temelden kurulan problem çözme alışkanlığı.",
    href: "/tutors?exam_type=TYT&subject=Matematik",
    artwork: { scene: "worksheet", tone: "brand" },
  },
  {
    id: "ayt-matematik",
    title: "AYT Matematik",
    description: "Limit, türev ve integralde hız kazan.",
    href: "/tutors?exam_type=AYT&subject=Matematik",
    artwork: { scene: "graphing", tone: "sky" },
  },
  {
    id: "geometri",
    title: "Geometri",
    description: "Şekil okuma ve açı kurma pratiği.",
    href: "/tutors?subject=Geometri",
    artwork: { scene: "drafting", tone: "violet" },
  },
  {
    id: "paragraf",
    title: "Paragraf / Türkçe",
    description: "Hız ve doğruluğu birlikte artır.",
    href: "/tutors?exam_type=TYT&subject=Türkçe",
    artwork: { scene: "reading", tone: "cream" },
  },
  {
    id: "fizik",
    title: "Fizik",
    description: "Formül ezberi yerine kavram kurulumu.",
    href: "/tutors?subject=Fizik",
    artwork: { scene: "physics", tone: "slate" },
  },
  {
    id: "kpss-matematik",
    title: "KPSS Matematik",
    description: "Sınav formatına göre soru tipi çalışması.",
    href: "/tutors?exam_type=KPSS",
    artwork: { scene: "answerSheet", tone: "brand" },
  },
  {
    id: "dgs-sayisal",
    title: "DGS Sayısal",
    description: "Sayısal mantıkta düzenli tempo kur.",
    href: "/tutors?exam_type=DGS",
    artwork: { scene: "logic", tone: "sky" },
  },
  {
    id: "cikmis-sorular",
    title: "Çıkmış sorular",
    description: "Geçmiş yılların sorularıyla ölç.",
    href: "/cikmis-sorular",
    artwork: { scene: "archive", tone: "violet" },
  },
];

/**
 * Tabs for the discovery module. `subject` / `examType` are used to query real
 * tutors; when a tab returns nothing the module falls back to mock cards.
 */
export interface HomeDiscoveryTabContent {
  value: string;
  label: string;
  examType?: string;
  subject?: string;
}

export const HOME_DISCOVERY_TABS: HomeDiscoveryTabContent[] = [
  { value: "tyt-mat", label: "TYT Matematik", examType: "TYT", subject: "Matematik" },
  { value: "ayt-mat", label: "AYT Matematik", examType: "AYT", subject: "Matematik" },
  { value: "geometri", label: "Geometri", subject: "Geometri" },
  { value: "fizik", label: "Fizik", subject: "Fizik" },
  { value: "kimya", label: "Kimya", subject: "Kimya" },
  { value: "turkce", label: "Paragraf", examType: "TYT", subject: "Türkçe" },
  { value: "kpss", label: "KPSS", examType: "KPSS" },
  { value: "dgs", label: "DGS", examType: "DGS" },
];

/**
 * Placeholder teacher cards. Used when the tutors API returns too few results
 * to fill a rail — the rail keeps its shape instead of collapsing.
 *
 * Names are obviously generic placeholders, not real people.
 */
export interface HomeMockTeacher {
  id: string;
  name: string;
  university: string;
  department: string;
  subjects: string[];
  rating: number;
  totalReviews: number;
  price: number;
}

export const HOME_MOCK_TEACHERS: HomeMockTeacher[] = [
  {
    id: "mock-1",
    name: "Örnek Hoca A",
    university: "Örnek Üniversitesi",
    department: "Matematik",
    subjects: ["TYT Matematik", "Problemler"],
    rating: 4.8,
    totalReviews: 124,
    price: 450,
  },
  {
    id: "mock-2",
    name: "Örnek Hoca B",
    university: "Örnek Teknik Üniversitesi",
    department: "Fizik",
    subjects: ["AYT Fizik", "Geometri"],
    rating: 4.7,
    totalReviews: 89,
    price: 520,
  },
  {
    id: "mock-3",
    name: "Örnek Hoca C",
    university: "Örnek Üniversitesi",
    department: "Türk Dili ve Edebiyatı",
    subjects: ["Paragraf", "TYT Türkçe"],
    rating: 4.9,
    totalReviews: 203,
    price: 400,
  },
  {
    id: "mock-4",
    name: "Örnek Hoca D",
    university: "Örnek Teknik Üniversitesi",
    department: "Kimya",
    subjects: ["AYT Kimya", "Organik Kimya"],
    rating: 4.6,
    totalReviews: 61,
    price: 480,
  },
  {
    id: "mock-5",
    name: "Örnek Hoca E",
    university: "Örnek Üniversitesi",
    department: "İktisat",
    subjects: ["KPSS Genel Yetenek", "DGS Sayısal"],
    rating: 4.5,
    totalReviews: 47,
    price: 380,
  },
  {
    id: "mock-6",
    name: "Örnek Hoca F",
    university: "Örnek Üniversitesi",
    department: "Matematik",
    subjects: ["DGS Sayısal", "Mantık"],
    rating: 4.7,
    totalReviews: 72,
    price: 430,
  },
];

export interface HomeGoalCardContent {
  id: string;
  title: string;
  description: string;
  chips: string[];
  href: string;
  artwork: HomeArtwork;
}

export const HOME_GOAL_CARDS: HomeGoalCardContent[] = [
  {
    id: "tip",
    title: "Tıp hedefleyenler",
    description:
      "Sayısal netlerini yüksek tutmak için biyoloji, kimya ve matematikte düzenli tempo.",
    chips: ["AYT Biyoloji", "AYT Kimya", "AYT Matematik"],
    href: "/tutors?exam_type=AYT",
    artwork: { scene: "medicine", tone: "brand" },
  },
  {
    id: "muhendislik",
    title: "Mühendislik isteyenler",
    description:
      "Matematik ve fizikte soru tipi hakimiyeti, deneme sonrası hata analizi.",
    chips: ["AYT Matematik", "AYT Fizik", "Geometri"],
    href: "/tutors?exam_type=AYT&subject=Fizik",
    artwork: { scene: "engineering", tone: "sky" },
  },
  {
    id: "hukuk",
    title: "Hukuk hedefleyenler",
    description:
      "Paragraf hızını ve sözel netlerini birlikte yukarı taşıyan bir çalışma düzeni.",
    chips: ["TYT Türkçe", "AYT Edebiyat", "Tarih"],
    href: "/tutors?exam_type=AYT&subject=Edebiyat",
    artwork: { scene: "law", tone: "cream" },
  },
  {
    id: "ogretmenlik",
    title: "Öğretmenlik hedefi",
    description:
      "Alan bilgisi ve KPSS hazırlığını aynı planda ilerletmek isteyenler için.",
    chips: ["KPSS Genel Yetenek", "Alan bilgisi"],
    href: "/tutors?exam_type=KPSS",
    artwork: { scene: "teaching", tone: "violet" },
  },
];

export interface HomeTopicLinkContent {
  label: string;
  href: string;
  /** Placeholder popularity figure — not a real metric. */
  learners: string;
}

export interface HomeTopicColumnContent {
  id: string;
  heading: string;
  links: HomeTopicLinkContent[];
}

export const HOME_TOPIC_COLUMNS: HomeTopicColumnContent[] = [
  {
    id: "sayisal",
    heading: "Sayısal",
    links: [
      { label: "TYT Matematik", href: "/tutors?exam_type=TYT&subject=Matematik", learners: "12.400 öğrenci" },
      { label: "Problemler", href: "/tutors?subject=Matematik", learners: "9.150 öğrenci" },
      { label: "Geometri", href: "/tutors?subject=Geometri", learners: "7.820 öğrenci" },
      { label: "AYT Fizik", href: "/tutors?exam_type=AYT&subject=Fizik", learners: "5.640 öğrenci" },
    ],
  },
  {
    id: "sozel",
    heading: "Sözel",
    links: [
      { label: "Paragraf", href: "/tutors?exam_type=TYT&subject=Türkçe", learners: "11.300 öğrenci" },
      { label: "AYT Edebiyat", href: "/tutors?exam_type=AYT&subject=Edebiyat", learners: "4.980 öğrenci" },
      { label: "Tarih", href: "/tutors?subject=Tarih", learners: "3.470 öğrenci" },
      { label: "Coğrafya", href: "/tutors?subject=Coğrafya", learners: "2.910 öğrenci" },
    ],
  },
  {
    id: "diger-sinavlar",
    heading: "Diğer sınavlar",
    links: [
      { label: "KPSS Genel Yetenek", href: "/tutors?exam_type=KPSS", learners: "6.220 öğrenci" },
      { label: "DGS Sayısal Mantık", href: "/tutors?exam_type=DGS", learners: "3.860 öğrenci" },
      { label: "YDT İngilizce", href: "/tutors?exam_type=YDT", learners: "2.140 öğrenci" },
      { label: "Organik Kimya", href: "/tutors?subject=Kimya", learners: "1.980 öğrenci" },
    ],
  },
];

export const HOME_TOPIC_FEATURED = {
  title: "Paragraf bu dönem en çok çalışılan konu",
  description:
    "Süre yönetimi ve doğru okuma tekniğiyle netlerini en hızlı artırabileceğin alan.",
  ctaLabel: "Paragraf hocalarına bak",
  ctaHref: "/tutors?exam_type=TYT&subject=Türkçe",
} as const;

export const HOME_PROMO_STRIP = {
  title: "Doğru hocayla hedefini netleştir",
  description:
    "Yüzlerce doğrulanmış hoca, çıkmış sorular ve hazır çalışma planları tek platformda.",
  ctaLabel: "Hocaları keşfet",
  ctaHref: "/tutors",
} as const;

/**
 * Static showcase content for the authenticated student home.
 *
 * This is deliberately mock/placeholder data. The homepage redesign needs a
 * full editorial rhythm (hero slider, discovery rails, goal storytelling)
 * before the backend has endpoints for any of it. Every `href` here points at
 * a route that really exists, so the composition is navigable even though the
 * copy is editorial placeholder copy.
 *
 * Replace section by section as real endpoints land.
 *
 * Imagery: the explore and goal cards use local photography from
 * `public/images/home-v3/`. Sources, creators and license notes for every
 * file are documented in `docs/design/product-home/image-sources.md`.
 */

import type { HomeVisualTone } from "@/components/home/HomeVisual";
import type { HomeHeroScene } from "@/components/home/HomeHeroArt";

/** Local editorial photography used by the discovery and goal cards. */
export interface HomeCardImage {
  /** Path under `public/`, e.g. `/images/home-v3/explore/tyt-matematik.jpg`. */
  src: string;
  alt: string;
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
  image?: HomeCardImage;
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
    image: {
      src: "/images/home-v3/hero/yks-students.jpg",
      alt: "Sınava birlikte hazırlanan genç öğrenciler",
    },
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
    image: {
      src: "/images/home-v3/explore/kpss-matematik.jpg",
      alt: "Sınav salonunda sınav kağıdını çözen bir öğrenci",
    },
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
    image: {
      src: "/images/home-v3/explore/tyt-matematik.jpg",
      alt: "Sınav kağıtları ve matematik notları üzerinde çalışan bir öğrenci",
    },
  },
  {
    id: "exam-prep",
    eyebrow: "Sınav hazırlığı",
    title: "Deneme sonuçlarını hocanla birlikte geliştir",
    description:
      "Eksiklerini belirle, çalışma ritmini oluştur ve sınav gününe kadar ilerlemeni düzenli takip et.",
    ctaLabel: "Hocaları keşfet",
    ctaHref: "/tutors",
    scene: "exam",
    tone: "cream",
    image: {
      src: "/images/home-v3/explore/cikmis-sorular.jpg",
      alt: "Sınav hazırlığı için düzenlenmiş basılı soru kağıtları",
    },
  },
];

export interface HomeExploreCardContent {
  id: string;
  title: string;
  href: string;
  image: HomeCardImage;
}

export const HOME_EXPLORE_CARDS: HomeExploreCardContent[] = [
  {
    id: "tyt-matematik",
    title: "TYT Matematik",
    href: "/tutors?exam_type=TYT&subject=Matematik",
    image: {
      src: "/images/home-v3/explore/tyt-matematik.jpg",
      alt: "Defterine matematik problemi çözen bir öğrenci",
    },
  },
  {
    id: "ayt-matematik",
    title: "AYT Matematik",
    href: "/tutors?exam_type=AYT&subject=Matematik",
    image: {
      src: "/images/home-v3/explore/ayt-matematik.jpg",
      alt: "Türev ve integral formülleriyle dolu bir çalışma sayfası",
    },
  },
  {
    id: "geometri",
    title: "Geometri",
    href: "/tutors?subject=Geometri",
    image: {
      src: "/images/home-v3/explore/geometri.jpg",
      alt: "Pergel ve cetvelle çizilen geometrik şekiller",
    },
  },
  {
    id: "paragraf",
    title: "Paragraf / Türkçe",
    href: "/tutors?exam_type=TYT&subject=Türkçe",
    image: {
      src: "/images/home-v3/explore/paragraf.jpg",
      alt: "Masada açık bir kitap okuyan öğrenci",
    },
  },
  {
    id: "fizik",
    title: "Fizik",
    href: "/tutors?subject=Fizik",
    image: {
      src: "/images/home-v3/explore/fizik.jpg",
      alt: "Tahtada fizik formülleri",
    },
  },
  {
    id: "kpss-matematik",
    title: "KPSS Matematik",
    href: "/tutors?exam_type=KPSS",
    image: {
      src: "/images/home-v3/explore/kpss-matematik.jpg",
      alt: "Optik cevap formu üzerinde çalışan aday",
    },
  },
  {
    id: "dgs-sayisal",
    title: "DGS Sayısal",
    href: "/tutors?exam_type=DGS",
    image: {
      src: "/images/home-v3/explore/dgs-sayisal.jpg",
      alt: "Hesap makinesi ve notlarla sayısal soru çözen öğrenci",
    },
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
  templateSlug: string;
  /** Safe destination while learning templates are still loading. */
  href: string;
  image: HomeCardImage;
}

export const HOME_GOAL_CARDS: HomeGoalCardContent[] = [
  {
    id: "tip",
    title: "Tıp hedefleyenler",
    description:
      "Sayısal netlerini yüksek tutmak için biyoloji, kimya ve matematikte düzenli tempo.",
    chips: ["AYT Biyoloji", "AYT Kimya", "AYT Matematik"],
    templateSlug: "yks-deneme-analizi-strateji",
    href: "/dashboard/student",
    image: {
      src: "/images/home-v3/goals/tip.jpg",
      alt: "Kitapları ve steteskopuyla çalışan bir tıp öğrencisi",
    },
  },
  {
    id: "muhendislik",
    title: "Mühendislik isteyenler",
    description:
      "Matematik ve fizikte soru tipi hakimiyeti, deneme sonrası hata analizi.",
    chips: ["AYT Matematik", "AYT Fizik", "Geometri"],
    templateSlug: "ayt-turev-limit",
    href: "/dashboard/student",
    image: {
      src: "/images/home-v3/goals/muhendislik.jpg",
      alt: "Teknik çizim üzerinde çalışan bir mühendislik öğrencisi",
    },
  },
  {
    id: "hukuk",
    title: "Hukuk hedefleyenler",
    description:
      "Paragraf hızını ve sözel netlerini birlikte yukarı taşıyan bir çalışma düzeni.",
    chips: ["TYT Türkçe", "AYT Edebiyat", "Tarih"],
    templateSlug: "tyt-paragraf-turkce-net-artirma",
    href: "/dashboard/student",
    image: {
      src: "/images/home-v3/goals/hukuk.jpg",
      alt: "Hukuk kitapları ve adalet terazisi",
    },
  },
  {
    id: "ogretmenlik",
    title: "Öğretmenlik hedefi",
    description:
      "Alan bilgisi ve KPSS hazırlığını aynı planda ilerletmek isteyenler için.",
    chips: ["KPSS Genel Yetenek", "Alan bilgisi"],
    templateSlug: "kpss-genel-yetenek-matematik",
    href: "/dashboard/student",
    image: {
      src: "/images/home-v3/goals/ogretmenlik.jpg",
      alt: "Kara tahta başında ders anlatan bir öğretmen",
    },
  },
];

export interface HomeTopicLinkContent {
  label: string;
  href: string;
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
      { label: "TYT Matematik", href: "/tutors?exam_type=TYT&subject=Matematik" },
      { label: "Problemler", href: "/tutors?subject=Matematik" },
      { label: "Geometri", href: "/tutors?subject=Geometri" },
      { label: "AYT Fizik", href: "/tutors?exam_type=AYT&subject=Fizik" },
    ],
  },
  {
    id: "sozel",
    heading: "Sözel",
    links: [
      { label: "Paragraf", href: "/tutors?exam_type=TYT&subject=Türkçe" },
      { label: "AYT Edebiyat", href: "/tutors?exam_type=AYT&subject=Edebiyat" },
      { label: "Tarih", href: "/tutors?subject=Tarih" },
      { label: "Coğrafya", href: "/tutors?subject=Coğrafya" },
    ],
  },
  {
    id: "diger-sinavlar",
    heading: "Diğer sınavlar",
    links: [
      { label: "KPSS Genel Yetenek", href: "/tutors?exam_type=KPSS" },
      { label: "DGS Sayısal Mantık", href: "/tutors?exam_type=DGS" },
      { label: "YDT İngilizce", href: "/tutors?exam_type=YDT" },
      { label: "Organik Kimya", href: "/tutors?subject=Kimya" },
    ],
  },
];

export const HOME_TOPIC_FEATURED = {
  title: "Paragraf netlerini düzenli pratikle güçlendir",
  description:
    "Süre yönetimi ve doğru okuma tekniği, paragraf netlerini artırmanın temel adımları.",
  ctaLabel: "Paragraf hocalarına bak",
  ctaHref: "/tutors?exam_type=TYT&subject=Türkçe",
} as const;

export const HOME_PROMO_STRIP = {
  title: "Doğru hocayla hedefini netleştir",
  description:
    "Doğrulanmış hocalar, çıkmış sorular ve çalışma planları tek platformda.",
  ctaLabel: "Hocaları keşfet",
  ctaHref: "/tutors",
} as const;

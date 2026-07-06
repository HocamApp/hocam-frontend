import {
  Briefcase,
  Compass,
  FunctionSquare,
  GraduationCap,
  Puzzle,
  Sigma,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { LearningGoalTemplate } from "@/types";
import type { TutorFilters } from "@/lib/tutorsApi";

export interface LearningCategory {
  /** DOM anchor id for scroll navigation. */
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  match: (template: LearningGoalTemplate) => boolean;
}

export interface CatalogSection {
  category: LearningCategory;
  templates: LearningGoalTemplate[];
}

function examTypeOf(template: LearningGoalTemplate) {
  return template.exam_type.toUpperCase();
}

/**
 * Display-only grouping of backend templates into Cambly-style catalog
 * sections. A template may appear in several sections; render keys must
 * therefore combine category id and template id.
 */
export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: "one-cikanlar",
    title: "Öne Çıkanlar",
    description: "Hocam'da en çok tercih edilen hedef paketleri",
    icon: Sparkles,
    match: (t) => t.is_featured,
  },
  {
    id: "yks-hazirlik",
    title: "YKS'ye Hazırlık",
    description: "TYT ve AYT için üniversite sınavına giden yolun tamamı",
    icon: GraduationCap,
    match: (t) => ["TYT", "AYT", "YKS"].includes(examTypeOf(t)),
  },
  {
    id: "tyt-matematik",
    title: "TYT Matematik",
    description: "Temelden problemlere TYT matematiğini güçlendir",
    icon: Sigma,
    match: (t) => examTypeOf(t) === "TYT" && /matematik/i.test(t.subject_name),
  },
  {
    id: "ayt-matematik",
    title: "AYT Matematik",
    description: "Fonksiyonlardan integrale AYT'nin kritik konu paketleri",
    icon: FunctionSquare,
    match: (t) => examTypeOf(t) === "AYT" && /matematik/i.test(t.subject_name),
  },
  {
    id: "problem-net",
    title: "Problem & Net Artırma",
    description: "Soru çözme hızını ve doğruluğunu nete çevir",
    icon: Puzzle,
    match: (t) => /problem|net-artirma|paragraf/.test(t.slug),
  },
  {
    id: "kpss-dgs",
    title: "KPSS / DGS",
    description: "KPSS ve DGS sayısal hazırlığı için yoğun paketler",
    icon: Briefcase,
    match: (t) => ["KPSS", "DGS"].includes(examTypeOf(t)),
  },
  {
    id: "mentorluk-strateji",
    title: "Mentorluk & Strateji",
    description: "Deneme analizi, çalışma düzeni ve sınav stratejisi",
    icon: Compass,
    match: (t) => /deneme|strateji|analiz|mentorluk/.test(t.slug),
  },
];

/** Groups templates into the non-empty catalog sections, in category order. */
export function buildCatalogSections(
  templates: LearningGoalTemplate[]
): CatalogSection[] {
  return LEARNING_CATEGORIES.map((category) => ({
    category,
    templates: templates.filter(category.match),
  })).filter((section) => section.templates.length > 0);
}

/**
 * Exam types that exist on tutor Subject rows. Other package exam types
 * (YKS, KPSS, DGS, LGS) query by subject only so students still find
 * e.g. math tutors instead of an always-empty list.
 */
const TUTOR_SEARCH_EXAM_TYPES = new Set(["TYT", "AYT"]);

export function getPackageTutorFilters(
  template: LearningGoalTemplate
): TutorFilters {
  const examType = examTypeOf(template);
  return {
    subject: template.subject_name,
    exam_type: TUTOR_SEARCH_EXAM_TYPES.has(examType) ? examType : undefined,
  };
}

/** Pre-filtered tutor marketplace link for a package. */
export function getPackageTutorSearchHref(template: LearningGoalTemplate) {
  const filters = getPackageTutorFilters(template);
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `/tutors?${params.toString()}`;
}

/** Other packages to suggest on a detail page: same exam/subject first, then featured. */
export function getRelatedTemplates(
  current: LearningGoalTemplate,
  all: LearningGoalTemplate[],
  max = 3
): LearningGoalTemplate[] {
  const score = (t: LearningGoalTemplate) => {
    const related =
      examTypeOf(t) === examTypeOf(current) ||
      t.subject_name.toLowerCase() === current.subject_name.toLowerCase();
    return (related ? 2 : 0) + (t.is_featured ? 1 : 0);
  };

  return all
    .filter((t) => t.id !== current.id)
    .map((t, index) => ({ t, index, score: score(t) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, max)
    .map(({ t }) => t);
}

import type { TutorSavedSearch } from "@/types";
import type { TutorFilters } from "@/lib/tutorsApi";

export function defaultTutorOrdering(filters: TutorFilters): "relevance" | "rating" {
  return filters.search || filters.subject || filters.topic ? "relevance" : "rating";
}

export function removeTutorFilterCategory(
  filters: TutorFilters,
  category: string
): TutorFilters {
  const next = { ...filters };
  const keys: Record<string, (keyof TutorFilters)[]> = {
    search: ["search"], topic: ["topic"], subject: ["subject", "exam_type"],
    teaching_attributes: ["teaching_attributes"], university: ["university"],
    rating: ["min_rating"], price: ["min_price", "max_price"],
    yks_rank: ["yks_rank_max"], verification: ["is_verified"], online: ["online"],
    availability: ["availability_day", "availability_time"],
  };
  (keys[category] ?? []).forEach((key) => delete next[key]);
  return next;
}

export function savedSearchToTutorFilters(saved: TutorSavedSearch): TutorFilters {
  const filters: TutorFilters = {};
  Object.entries(saved.filters).forEach(([key, value]) => {
    if (key === "teaching_attributes" && Array.isArray(value)) {
      filters.teaching_attributes = value.join(",");
    } else if (typeof value === "string") {
      (filters as Record<string, string>)[key] = value;
    }
  });
  filters.ordering = saved.ordering;
  return filters;
}

export const RELAXATION_LABELS: Record<string, string> = {
  search: "Arama",
  topic: "Konu",
  subject: "Ders ve sınav",
  teaching_attributes: "Anlatım özelliği",
  university: "Üniversite",
  rating: "Puan",
  price: "Fiyat",
  yks_rank: "YKS sıralaması",
  verification: "Doğrulama",
  online: "Çevrim içi",
  availability: "Uygunluk",
};

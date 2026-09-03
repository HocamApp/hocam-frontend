import type { TutorFilters } from "./tutorsApi";

export const TUTOR_LIST_ID = "ys-tutor-list-title";
const FILTER_KEYS = ["subject", "exam_type", "university", "min_rating", "min_price", "max_price", "is_verified", "yks_rank_max", "ordering", "availability_day", "availability_time", "online", "teaching_attributes", "topic", "has_coaching", "free_coaching"] as const satisfies readonly (keyof TutorFilters)[];

export function readDirectoryFilters(params: Pick<URLSearchParams, "get">): TutorFilters {
  return Object.fromEntries(FILTER_KEYS.flatMap(key => {
    const value = params.get(key);
    return value ? [[key, value]] : [];
  }));
}

export function directoryFilterQuery(current: string, filters: TutorFilters): string {
  const params = new URLSearchParams(current);
  for (const key of FILTER_KEYS) {
    params.delete(key);
    if (filters[key]) params.set(key, filters[key]!);
  }
  params.delete("page");
  return params.toString();
}

export function tutorListHref(filters: TutorFilters = {}): string {
  const query = directoryFilterQuery("", filters);
  return `/${query ? `?${query}` : ""}#${TUTOR_LIST_ID}`;
}

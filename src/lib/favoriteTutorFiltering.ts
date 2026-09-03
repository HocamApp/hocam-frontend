import type { TutorFilters } from "@/lib/tutorsApi";
import type { TutorProfile } from "@/types";

/**
 * Filtering and ordering for the favourites page, done in the browser.
 *
 * The favourites endpoint returns the saved tutors whole — it takes no filter
 * query and no page. So the page either ships the filter panel and does the
 * work here, or ships controls that move nothing. This is the first.
 *
 * Only the filters that can be answered from a `TutorProfile` in a list
 * response are honoured. Availability day/time and topic need data the list
 * never carries, so they are ignored rather than silently emptying the page;
 * `FAVORITE_UNSUPPORTED_FILTERS` names them so the page can say so.
 */

/** Filter keys the favourites list cannot answer client-side. */
export const FAVORITE_UNSUPPORTED_FILTERS: (keyof TutorFilters)[] = [
  "availability_day",
  "availability_time",
  "topic",
];

/** Turkish-safe lowercase for the free-text match. */
function fold(value: string): string {
  return value
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLocaleLowerCase("tr");
}

function matchesSearch(tutor: TutorProfile, term: string): boolean {
  const haystack = [
    tutor.name,
    tutor.surname,
    tutor.university,
    tutor.department,
    tutor.bio,
    ...tutor.subjects.map((subject) => subject.name),
  ]
    .filter(Boolean)
    .map(fold)
    .join(" ");

  // Every word has to appear somewhere, so "boğaziçi fizik" narrows rather
  // than widening the way an OR would.
  return fold(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function numeric(value: string | undefined): number | null {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function filterFavoriteTutors(
  tutors: TutorProfile[],
  filters: TutorFilters,
): TutorProfile[] {
  const minRating = numeric(filters.min_rating);
  const minPrice = numeric(filters.min_price);
  const maxPrice = numeric(filters.max_price);
  const maxRank = numeric(filters.yks_rank_max);
  const attributes = (filters.teaching_attributes ?? "")
    .split(",")
    .filter(Boolean);

  return tutors.filter((tutor) => {
    if (filters.search && !matchesSearch(tutor, filters.search)) return false;

    if (filters.subject || filters.exam_type) {
      const matchesSubject = tutor.subjects.some(subject =>
        (!filters.subject || subject.name === filters.subject) &&
        (!filters.exam_type || (filters.exam_type === "YKS"
          ? ["TYT", "AYT"].includes(subject.exam_type)
          : subject.exam_type === filters.exam_type)),
      );
      if (!matchesSubject) return false;
    }

    if (filters.university && tutor.university !== filters.university) {
      return false;
    }

    if (minRating !== null && tutor.rating < minRating) return false;
    if (minPrice !== null && tutor.hourly_price < minPrice) return false;
    if (maxPrice !== null && tutor.hourly_price > maxPrice) return false;
    // A rank filter is "top N", so a tutor with no rank on file is out rather
    // than sorting as rank zero.
    if (maxRank !== null && !(tutor.yks_rank > 0 && tutor.yks_rank <= maxRank)) {
      return false;
    }

    if (filters.is_verified === "true" && !tutor.is_verified) return false;
    if (filters.online === "true" && !tutor.is_online) return false;
    if (filters.has_coaching === "true" && !tutor.offers_coaching) return false;
    if (filters.free_coaching === "true" && !tutor.offers_free_coaching) {
      return false;
    }

    if (attributes.length > 0) {
      const owned = new Set(
        (tutor.teaching_attributes ?? []).map((attribute) => attribute.code),
      );
      if (!attributes.every((code) => owned.has(code))) return false;
    }

    return true;
  });
}

/**
 * The three ordering chips, applied locally.
 *
 * "relevance" is the server's own ranking and cannot be reproduced here, so it
 * leaves the saved order alone rather than inventing a different one.
 */
export function sortFavoriteTutors(
  tutors: TutorProfile[],
  ordering: string | undefined,
): TutorProfile[] {
  const sorted = [...tutors];
  if (ordering === "price") {
    sorted.sort((a, b) => a.hourly_price - b.hourly_price);
  } else if (ordering === "yks_rank") {
    // Unranked tutors go last instead of first, which is where a plain
    // ascending sort on zero would put them.
    const rank = (tutor: TutorProfile) =>
      tutor.yks_rank > 0 ? tutor.yks_rank : Number.POSITIVE_INFINITY;
    sorted.sort((a, b) => rank(a) - rank(b));
  } else if (ordering === "rating" || ordering === undefined) {
    sorted.sort((a, b) => b.rating - a.rating);
  }
  return sorted;
}

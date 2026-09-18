import type { Metadata } from "next";

import type { TutorFilters } from "@/lib/tutorsApi";
import { ANONYMOUS_PAGE_LIMIT } from "@/lib/anonymousBrowsing";
import { absoluteUrl, SITE_DESCRIPTION, SOCIAL_IMAGE } from "@/lib/seo";
import { DIRECTORY_FILTER_KEYS } from "@/lib/tutorDirectoryLinks";

export type DirectorySearchParams = Record<
  string,
  string | string[] | undefined
>;

export const MAX_DIRECTORY_PAGE = 100;
const MAX_FILTER_LENGTH = 80;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDirectoryPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, MAX_DIRECTORY_PAGE)
    : 1;
}

function normalizedFilterValue(value: string | string[] | undefined) {
  return (firstValue(value) ?? "").trim().slice(0, MAX_FILTER_LENGTH);
}

export function directoryFiltersFromRecord(
  params: DirectorySearchParams,
): TutorFilters {
  const filters: TutorFilters = {};
  for (const key of DIRECTORY_FILTER_KEYS) {
    const value = normalizedFilterValue(params[key]);
    if (value) filters[key] = value;
  }
  const search = normalizedFilterValue(params.search);
  if (search) filters.search = search;
  return filters;
}

export function hasIndexChangingDirectoryParams(params: DirectorySearchParams) {
  return (
    Boolean(firstValue(params.search)) ||
    Boolean(firstValue(params.favorites)) ||
    DIRECTORY_FILTER_KEYS.some((key) => Boolean(firstValue(params[key])))
  );
}

export function tutorDirectoryQueryKey(filters: TutorFilters, page: number) {
  return ["tutors", filters, page] as const;
}

export function homeDirectoryMetadata(params: DirectorySearchParams): Metadata {
  const page = parseDirectoryPage(params.page);
  const filtered = hasIndexChangingDirectoryParams(params);
  const gated = page > ANONYMOUS_PAGE_LIMIT;
  const title =
    !filtered && !gated && page > 1
      ? `Doğrulanmış YKS Hocaları – Sayfa ${page}`
      : "Doğrulanmış YKS Hocaları";

  return {
    title,
    description:
      "TYT ve AYT dersleri için doğrulanmış hocaları ders, YKS sıralaması, fiyat ve uygunluk bilgilerine göre inceleyin.",
    robots: filtered || gated
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      title: `${title} | Hocam`,
      description: SITE_DESCRIPTION,
      images: [SOCIAL_IMAGE],
    },
  };
}

export function homeDirectoryCanonical(params: DirectorySearchParams) {
  const page = parseDirectoryPage(params.page);
  const filtered = hasIndexChangingDirectoryParams(params);
  const gated = page > ANONYMOUS_PAGE_LIMIT;
  return absoluteUrl(!filtered && !gated && page > 1 ? `?page=${page}` : "/");
}

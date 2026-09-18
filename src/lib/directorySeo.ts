import type { Metadata } from "next";

import type { TutorFilters } from "@/lib/tutorsApi";
import { absoluteUrl, SITE_DESCRIPTION } from "@/lib/seo";
import { DIRECTORY_FILTER_KEYS } from "@/lib/tutorDirectoryLinks";

export type DirectorySearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseDirectoryPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstValue(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function directoryFiltersFromRecord(
  params: DirectorySearchParams,
): TutorFilters {
  const filters: TutorFilters = {};
  for (const key of DIRECTORY_FILTER_KEYS) {
    const value = firstValue(params[key]);
    if (value) filters[key] = value;
  }
  const search = firstValue(params.search);
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
  const canonical = absoluteUrl(!filtered && page > 1 ? `?page=${page}` : "/");
  const title =
    !filtered && page > 1
      ? `Doğrulanmış YKS Hocaları – Sayfa ${page}`
      : "Doğrulanmış YKS Hocaları";

  return {
    title,
    description:
      "TYT ve AYT dersleri için doğrulanmış hocaları ders, YKS sıralaması, fiyat ve uygunluk bilgilerine göre inceleyin.",
    alternates: { canonical: { url: canonical } },
    robots: filtered
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${title} | Hocam`,
      description: SITE_DESCRIPTION,
    },
  };
}

import type { MetadataRoute } from "next";

import {
  absoluteUrl,
  fetchAllPublicTutors,
} from "@/lib/seo";
import { LEGAL_DOCUMENTS } from "@/lib/legalDocuments";
import { PUBLIC_SEO_ROUTES } from "@/lib/publicSeo";

export const revalidate = 3_600;

const PUBLIC_PAGE_LAST_MODIFIED: Record<
  (typeof PUBLIC_SEO_ROUTES)[number],
  string
> = {
  "/ucretsiz-deneme-dersi": "2026-09-03",
  "/yks-ozel-ders": "2026-09-10",
  "/yks/tyt/matematik-ozel-ders": "2026-09-10",
  "/yks/ayt/matematik-ozel-ders": "2026-09-10",
  "/nasil-calisir": "2026-09-04",
  "/hocalar-nasil-dogrulaniyor": "2026-09-04",
  "/hakkimizda": "2026-09-04",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date("2026-09-18"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...PUBLIC_SEO_ROUTES.map((route) => ({
      url: absoluteUrl(route),
      lastModified: new Date(PUBLIC_PAGE_LAST_MODIFIED[route]),
      changeFrequency: "weekly" as const,
      priority:
        route === "/yks-ozel-ders"
          ? 1
          : route.includes("matematik-ozel-ders")
            ? 0.9
            : 0.7,
    })),
    // Legal texts come from their own registry rather than
    // PUBLIC_SEO_ROUTES: that list is search-intent landing pages, and its
    // test asserts the array exactly.
    ...LEGAL_DOCUMENTS.map((doc) => ({
      url: absoluteUrl(doc.href),
      lastModified: doc.updatedAtIso ? new Date(doc.updatedAtIso) : undefined,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  try {
    const tutors = await fetchAllPublicTutors();
    for (const tutor of tutors) {
      pages.push({
        url: absoluteUrl(`/tutors/${encodeURIComponent(tutor.id)}`),
        lastModified: tutor.updated_at ? new Date(tutor.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Keep the stable tutor directory discoverable during a transient API
    // outage; the dynamic profile URLs return on the next revalidation.
    // The directory itself is "/" now — submitting the old /tutors would be
    // advertising a URL that only redirects.
  }

  return pages;
}

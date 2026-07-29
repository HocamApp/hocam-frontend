import type { MetadataRoute } from "next";

import {
  absoluteUrl,
  fetchAllPublicTutors,
} from "@/lib/seo";
import { PUBLIC_SEO_ROUTES } from "@/lib/publicSeo";

export const revalidate = 3_600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/tutors"),
      changeFrequency: "daily",
      priority: 1,
    },
    ...PUBLIC_SEO_ROUTES.map((route) => ({
      url: absoluteUrl(route),
      changeFrequency: "weekly" as const,
      priority:
        route === "/yks-ozel-ders"
          ? 1
          : route.includes("matematik-ozel-ders")
            ? 0.9
            : 0.7,
    })),
  ];

  try {
    const tutors = await fetchAllPublicTutors();
    for (const tutor of tutors) {
      pages.push({
        url: absoluteUrl(`/tutors/${encodeURIComponent(tutor.id)}`),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Keep the stable tutor directory discoverable during a transient API
    // outage; the dynamic profile URLs return on the next revalidation.
  }

  return pages;
}

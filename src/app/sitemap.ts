import type { MetadataRoute } from "next";

import {
  absoluteUrl,
  fetchAllPublicTutors,
} from "@/lib/seo";

export const revalidate = 3_600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/tutors"),
      changeFrequency: "daily",
      priority: 1,
    },
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

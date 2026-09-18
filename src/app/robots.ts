import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";
import { PRIVATE_CRAWL_PATHS } from "@/lib/seoRoutes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_CRAWL_PATHS],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

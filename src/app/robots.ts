import type { MetadataRoute } from "next";

import { TOOLS_ENABLED } from "@/lib/featureFlags";
import { SITE_URL } from "@/lib/seo";

export default function robots(toolsEnabled = TOOLS_ENABLED): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin-control",
        "/ai",
        "/checkout",
        "/dashboard",
        "/forgot-password",
        "/hoca-bul",
        "/home",
        "/login",
        "/messages",
        "/profile",
        "/register",
        "/reset-password",
        "/session",
        "/support",
        "/tutor",
        "/*/checkout",
      ],
    },
    // The tools app (/araclar) publishes its own sitemap; a sitemap may only
    // list URLs at or below its own path, so it cannot be folded into ours.
    // Off, this stays the single string it always was.
    sitemap: toolsEnabled
      ? [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/araclar/sitemap.xml`]
      : `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

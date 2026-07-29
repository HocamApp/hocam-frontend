import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin-control",
        "/ai",
        "/checkout",
        "/cikmis-sorular",
        "/dashboard",
        "/forgot-password",
        "/hoca-bul",
        "/home",
        "/login",
        "/match",
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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

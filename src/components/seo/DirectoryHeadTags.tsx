"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Next 14 drops a query string from Metadata API URLs whose pathname is `/`.
 * The directory intentionally uses `?page=N`, so emit these two URL tags
 * through the framework's server-head insertion hook instead.
 */
export function DirectoryHeadTags({ url }: { url: string }) {
  const inserted = useRef(false);
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <>
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
      </>
    );
  });

  useEffect(() => {
    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = url;

    let openGraphUrl = document.head.querySelector<HTMLMetaElement>(
      'meta[property="og:url"]',
    );
    if (!openGraphUrl) {
      openGraphUrl = document.createElement("meta");
      openGraphUrl.setAttribute("property", "og:url");
      document.head.append(openGraphUrl);
    }
    openGraphUrl.content = url;
  }, [url]);

  return null;
}

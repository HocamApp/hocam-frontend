import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { JsonLd } from "@/components/seo/JsonLd";
import { DirectoryHeadTags } from "@/components/seo/DirectoryHeadTags";
import { YemeksepetiHome } from "@/components/yemeksepeti/YemeksepetiHome";
import {
  fetchPublicSubjects,
  fetchPublicTutors,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/lib/seo";
import {
  directoryFiltersFromRecord,
  hasIndexChangingDirectoryParams,
  homeDirectoryCanonical,
  homeDirectoryMetadata,
  parseDirectoryPage,
  tutorDirectoryQueryKey,
  type DirectorySearchParams,
} from "@/lib/directorySeo";
import { ANONYMOUS_PAGE_LIMIT } from "@/lib/anonymousBrowsing";

/**
 * The homepage and the tutor directory, which in this design are one screen
 * rather than two: the root route lists the tutors, and the header's search
 * filters them.
 *
 * It lives in `(main)` rather than at the top of `app/` so it shares a layout
 * with the rest of the signed-in app. That is not filing tidiness — a layout
 * is the only thing React keeps mounted across a navigation, so this is what
 * lets the header survive `/` to `/dashboard/student` instead of being torn
 * down and rebuilt.
 *
 * Nothing from the reference page's runtime was carried over: no analytics,
 * tracking, cookie consent or third-party assets. The auth entry screen this
 * route used to host still lives at `/login` and `/register`.
 */

/*
 * Everything below moved from `(main)/tutors/layout.tsx`, which described the
 * directory back when the directory lived at /tutors. The route changed; the
 * facts did not.
 *
 * The `noindex` that used to sit here went with it. It was right while this
 * was an unfinished experiment and would be a quiet catastrophe now: this is
 * the page the site's search traffic is supposed to land on.
 */
type HomeProps = Readonly<{ searchParams: DirectorySearchParams }>;

export function generateMetadata({ searchParams }: HomeProps): Metadata {
  return homeDirectoryMetadata(searchParams);
}

export default async function Home({ searchParams }: HomeProps) {
  const filters = directoryFiltersFromRecord(searchParams);
  const requestedPage = parseDirectoryPage(searchParams.page);
  const page = Math.min(requestedPage, ANONYMOUS_PAGE_LIMIT);
  const filtered = hasIndexChangingDirectoryParams(searchParams);
  /* Warms the first page of the list the directory renders below. It used to
     be prefetched by the /tutors layout, where it also hydrated every tutor
     profile — those read `["tutor", id]` and never touched this cache, so it
     was work done for nobody. Here it warms the page that actually reads it. */
  const queryClient = new QueryClient();
  const prefetches = [
    queryClient.prefetchQuery({
      queryKey: ["subjects"],
      queryFn: fetchPublicSubjects,
    }),
  ];
  // Filter/search URLs are intentionally noindex and high-cardinality. Keep
  // them out of the server fetch cache; the browser requests the selected
  // view once instead of turning arbitrary query values into cache entries.
  if (!filtered) {
    prefetches.push(
      queryClient.prefetchQuery({
        queryKey: tutorDirectoryQueryKey(filters, page),
        queryFn: () => fetchPublicTutors(filters, page, 12),
      }),
    );
  }
  await Promise.allSettled(prefetches);

  return (
    <>
      <DirectoryHeadTags url={homeDirectoryCanonical(searchParams)} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": `${SITE_URL}/#service`,
            name: "Online YKS Özel Ders",
            description: SITE_DESCRIPTION,
            serviceType: "Online birebir özel ders",
            areaServed: { "@type": "Country", name: "Türkiye" },
            provider: { "@id": `${SITE_URL}/#organization` },
            url: SITE_URL,
          }}
        />
        <YemeksepetiHome />
      </HydrationBoundary>
    </>
  );
}

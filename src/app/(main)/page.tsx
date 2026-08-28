import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { JsonLd } from "@/components/seo/JsonLd";
import { YemeksepetiHome } from "@/components/yemeksepeti/YemeksepetiHome";
import {
  fetchPublicSubjects,
  fetchPublicTutors,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/lib/seo";

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
export const metadata: Metadata = {
  title: "Doğrulanmış YKS Hocaları",
  description:
    "TYT ve AYT dersleri için doğrulanmış hocaları ders, YKS sıralaması, fiyat ve uygunluk bilgilerine göre inceleyin.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Doğrulanmış YKS Hocaları | Hocam",
    description: "TYT ve AYT dersleri için doğrulanmış hocaları karşılaştırın.",
  },
};

export default async function Home() {
  /* Warms the first page of the list the directory renders below. It used to
     be prefetched by the /tutors layout, where it also hydrated every tutor
     profile — those read `["tutor", id]` and never touched this cache, so it
     was work done for nobody. Here it warms the page that actually reads it. */
  const queryClient = new QueryClient();
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["tutors", { ordering: "rating" }, 1],
      queryFn: () => fetchPublicTutors(1, 12),
    }),
    queryClient.prefetchQuery({
      queryKey: ["subjects"],
      queryFn: fetchPublicSubjects,
    }),
  ]);

  return (
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
  );
}

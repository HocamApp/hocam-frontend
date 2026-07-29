import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  fetchPublicSubjects,
  fetchPublicTutors,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Doğrulanmış YKS Hocaları",
  description:
    "TYT ve AYT dersleri için doğrulanmış hocaları ders, YKS sıralaması, fiyat ve uygunluk bilgilerine göre inceleyin.",
  alternates: {
    canonical: "/tutors",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "/tutors",
    title: "Doğrulanmış YKS Hocaları | Hocam",
    description:
      "TYT ve AYT dersleri için doğrulanmış hocaları karşılaştırın.",
  },
};

export default async function TutorsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
          "@id": `${SITE_URL}/tutors#service`,
          name: "Online YKS Özel Ders",
          description: SITE_DESCRIPTION,
          serviceType: "Online birebir özel ders",
          areaServed: {
            "@type": "Country",
            name: "Türkiye",
          },
          provider: {
            "@id": `${SITE_URL}/#organization`,
          },
          url: `${SITE_URL}/tutors`,
        }}
      />
      {children}
    </HydrationBoundary>
  );
}

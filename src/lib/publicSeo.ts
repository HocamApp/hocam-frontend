import type { Metadata } from "next";

import type { TutorProfile } from "@/types";
import {
  absoluteUrl,
  fetchAllPublicTutors,
  SITE_NAME,
} from "@/lib/seo";

export const PUBLIC_SEO_ROUTES = [
  "/yks-ozel-ders",
  "/yks/tyt/matematik-ozel-ders",
  "/yks/ayt/matematik-ozel-ders",
  "/nasil-calisir",
  "/hocalar-nasil-dogrulaniyor",
  "/hakkimizda",
] as const;

export type PublicSeoRoute = (typeof PUBLIC_SEO_ROUTES)[number];

export function publicPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: PublicSeoRoute;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: path,
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export async function loadPublicTutors(): Promise<TutorProfile[]> {
  try {
    return await fetchAllPublicTutors();
  } catch {
    return [];
  }
}

export function filterTutorsBySubject(
  tutors: TutorProfile[],
  examType: string,
  subjectName: string
) {
  const normalizedExam = examType.trim().toLocaleUpperCase("tr-TR");
  const normalizedSubject = subjectName.trim().toLocaleLowerCase("tr-TR");

  return tutors.filter((tutor) =>
    tutor.subjects.some(
      (subject) =>
        subject.exam_type.toLocaleUpperCase("tr-TR") === normalizedExam &&
        subject.name.trim().toLocaleLowerCase("tr-TR") === normalizedSubject
    )
  );
}

export type TutorPriceSummary = {
  count: number;
  minimum: number;
  median: number;
  maximum: number;
};

export function summarizeTutorPrices(
  tutors: TutorProfile[]
): TutorPriceSummary | null {
  const prices = tutors
    .map((tutor) => Number(tutor.hourly_price))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((left, right) => left - right);

  if (prices.length === 0) return null;

  const middle = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0
      ? Math.round((prices[middle - 1] + prices[middle]) / 2)
      : prices[middle];

  return {
    count: prices.length,
    minimum: prices[0],
    median,
    maximum: prices[prices.length - 1],
  };
}

export function publicWebPageJsonLd({
  path,
  name,
  description,
}: {
  path: PublicSeoRoute;
  name: string;
  description: string;
}) {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "tr-TR",
    isPartOf: {
      "@id": `${absoluteUrl("/")}#website`,
    },
    about: {
      "@id": `${absoluteUrl("/")}#organization`,
    },
  };
}

export function breadcrumbJsonLd(
  items: ReadonlyArray<{ label: string; href: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}

export function tutorItemListJsonLd({
  tutors,
  name,
  path,
}: {
  tutors: TutorProfile[];
  name: string;
  path: PublicSeoRoute;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl(path)}#tutors`,
    name,
    numberOfItems: tutors.length,
    itemListElement: tutors.map((tutor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/tutors/${encodeURIComponent(tutor.id)}`),
      item: {
        "@type": "Person",
        name: `${tutor.name} ${tutor.surname}`.trim(),
        url: absoluteUrl(`/tutors/${encodeURIComponent(tutor.id)}`),
      },
    })),
  };
}

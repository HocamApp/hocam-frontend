import type { Metadata } from "next";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { JsonLd } from "@/components/seo/JsonLd";
import {
  absoluteUrl,
  fetchPublicTutor,
  SITE_URL,
  tutorFullName,
  tutorSeoDescription,
} from "@/lib/seo";

type TutorLayoutProps = Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>;

export async function generateMetadata({
  params,
}: TutorLayoutProps): Promise<Metadata> {
  const tutor = await fetchPublicTutor(params.id);
  if (!tutor) {
    return {
      title: "Hoca Profili",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const name = tutorFullName(tutor);
  const description = tutorSeoDescription(tutor);
  const canonical = `/tutors/${encodeURIComponent(tutor.id)}`;

  return {
    title: {
      absolute: `${name} | YKS Özel Ders | Hocam`,
    },
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "profile",
      url: canonical,
      title: `${name} | Hocam`,
      description,
      images: tutor.profile_picture
        ? [
            {
              url: tutor.profile_picture,
              alt: name,
            },
          ]
        : undefined,
    },
  };
}

export default async function TutorProfileLayout({
  children,
  params,
}: TutorLayoutProps) {
  const tutor = await fetchPublicTutor(params.id);
  if (!tutor) return children;

  const queryClient = new QueryClient();
  queryClient.setQueryData(["tutor", params.id], tutor);

  const name = tutorFullName(tutor);
  const description = tutorSeoDescription(tutor);
  const profileUrl = absoluteUrl(`/tutors/${encodeURIComponent(tutor.id)}`);
  const personId = `${profileUrl}#person`;
  const rating =
    tutor.total_reviews > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(tutor.rating),
          ratingCount: tutor.total_reviews,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "@id": `${profileUrl}#profile`,
          url: profileUrl,
          name: `${name} | Hocam`,
          description,
          inLanguage: "tr-TR",
          dateCreated: tutor.created_at,
          mainEntity: {
            "@type": "Person",
            "@id": personId,
            name,
            url: profileUrl,
            image: tutor.profile_picture || undefined,
            description: tutor.bio || description,
            alumniOf: tutor.university
              ? {
                  "@type": "EducationalOrganization",
                  name: tutor.university,
                }
              : undefined,
            knowsAbout: tutor.subjects.map(
              (subject) => `${subject.exam_type} ${subject.name}`
            ),
            aggregateRating: rating,
          },
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
        }}
      />
      {children}
    </HydrationBoundary>
  );
}

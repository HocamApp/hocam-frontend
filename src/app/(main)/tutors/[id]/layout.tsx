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
  params: Promise<{ id: string }>;
}>;

export async function generateMetadata({
  params,
}: TutorLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const tutor = await fetchPublicTutor(id);
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
  const { id } = await params;
  const tutor = await fetchPublicTutor(id);
  if (!tutor) return children;

  const queryClient = new QueryClient();
  // Seeded as already stale, on purpose.
  //
  // This fetch is anonymous — it runs on the server for metadata and JSON-LD,
  // with no student's token — so it carries none of the per-student fields the
  // profile needs: trial_lesson_eligible, trial_lessons_remaining, and the
  // rest. Seeded fresh, it satisfied the client's five-minute staleTime and
  // the browser never asked again, so a signed-in student was shown the
  // signed-out answer: no free-trial CTA, no allowance box.
  //
  // updatedAt: 0 keeps the instant first paint and the SEO payload while
  // marking the entry stale, so the client refetches on mount with the token
  // and replaces it with the reader's own copy.
  queryClient.setQueryData(["tutor", id], tutor, { updatedAt: 0 });

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

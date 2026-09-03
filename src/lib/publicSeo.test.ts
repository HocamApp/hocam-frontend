import assert from "node:assert/strict";
import test from "node:test";

import type { ExamType, TutorProfile } from "@/types";
import {
  filterTutorsBySubject,
  PUBLIC_SEO_ROUTES,
  publicPageMetadata,
  summarizeTutorPrices,
} from "@/lib/publicSeo";

function tutor({
  id,
  price,
  examType,
  subjectName,
}: {
  id: string;
  price: number;
  examType: ExamType;
  subjectName: string;
}): TutorProfile {
  return {
    id,
    user: `user-${id}`,
    name: "Ada",
    surname: id,
    profile_picture: "",
    intro_video_url: "",
    bio: "",
    university: "Boğaziçi Üniversitesi",
    department: "Matematik",
    yks_rank: 1_000,
    hourly_price: price,
    rating: 4.8,
    total_reviews: 10,
    is_verified: true,
    is_public: true,
    teaching_styles: [],
    is_online: false,
    subjects: [
      {
        id: `subject-${id}`,
        name: subjectName,
        exam_type: examType,
      },
    ],
    created_at: "2026-07-29T00:00:00Z",
  };
}

test("public SEO routes are unique and separated by search intent", () => {
  assert.equal(new Set(PUBLIC_SEO_ROUTES).size, PUBLIC_SEO_ROUTES.length);
  assert.deepEqual(PUBLIC_SEO_ROUTES, [
    "/yks-ozel-ders",
    "/yks/tyt/matematik-ozel-ders",
    "/yks/ayt/matematik-ozel-ders",
    "/nasil-calisir",
    "/hocalar-nasil-dogrulaniyor",
    "/hakkimizda",
  ]);
});

test("subject filtering keeps TYT and AYT intent separate", () => {
  const tutors = [
    tutor({
      id: "tyt-math",
      price: 650,
      examType: "TYT",
      subjectName: "Matematik",
    }),
    tutor({
      id: "ayt-math",
      price: 700,
      examType: "AYT",
      subjectName: "Matematik",
    }),
    tutor({
      id: "tyt-physics",
      price: 800,
      examType: "TYT",
      subjectName: "Fizik",
    }),
  ];

  assert.deepEqual(
    filterTutorsBySubject(tutors, "TYT", "Matematik").map(
      (profile) => profile.id
    ),
    ["tyt-math"]
  );
  assert.deepEqual(
    filterTutorsBySubject(tutors, "AYT", "Matematik").map(
      (profile) => profile.id
    ),
    ["ayt-math"]
  );
});

test("price summary uses positive listed 40-minute prices", () => {
  const tutors = [
    tutor({ id: "1", price: 650, examType: "TYT", subjectName: "Matematik" }),
    tutor({ id: "2", price: 700, examType: "TYT", subjectName: "Matematik" }),
    tutor({ id: "3", price: 800, examType: "TYT", subjectName: "Matematik" }),
    tutor({
      id: "4",
      price: 1_100,
      examType: "TYT",
      subjectName: "Matematik",
    }),
  ];

  assert.deepEqual(summarizeTutorPrices(tutors), {
    count: 4,
    minimum: 650,
    median: 750,
    maximum: 1_100,
  });
});

test("public page metadata is canonical and indexable", () => {
  const metadata = publicPageMetadata({
    title: "YKS Online Özel Ders",
    description: "Doğrulanmış hocaları karşılaştırın.",
    path: "/yks-ozel-ders",
  });

  assert.equal(metadata.alternates?.canonical, "/yks-ozel-ders");
  assert.deepEqual(metadata.robots, { index: true, follow: true });
});

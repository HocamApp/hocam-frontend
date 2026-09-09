import assert from "node:assert/strict";
import test from "node:test";

import type { Review, TutorProfile, TutorReviewSummary } from "@/types";
import {
  applyDemoTutorPresentation,
  applyDemoTutorReviewPresentation,
  applyDemoTutorReviewSummaryPresentation,
} from "./demoTutorPresentation";

// Real Subject rows carry real database UUIDs. The demo override may relabel
// them but must never replace the id — see the SubjectLabel type.
const REAL_SUBJECT_IDS = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
];

function realSubjects(): TutorProfile["subjects"] {
  return REAL_SUBJECT_IDS.map((id, index) => ({
    id,
    name: `Gerçek Ders ${index + 1}`,
    exam_type: "TYT" as const,
  }));
}

function tutor(
  id: string,
  name: string,
  surname: string,
  profilePicture: string
): TutorProfile {
  return {
    id,
    name,
    surname,
    profile_picture: profilePicture,
    subjects: realSubjects(),
  } as TutorProfile;
}

test("updates only the three advertising demo tutors", () => {
  const ibrahim = applyDemoTutorPresentation(
    tutor("728ab84a-01dd-47ad-8b4b-2aec211d0679", "İbrahim", "Koç", "old.jpg")
  );
  const onur = applyDemoTutorPresentation(
    tutor("a017150a-81cd-4996-bbb3-776e71d7739f", "Onur", "Taş", "old.jpg")
  );
  const kerem = applyDemoTutorPresentation(
    tutor("dd612b39-0a51-4f59-994d-27792312a96b", "Kerem", "Özkan", "old.jpg")
  );

  assert.deepEqual(
    { name: ibrahim.name, surname: ibrahim.surname, image: ibrahim.profile_picture },
    { name: "Nazlı", surname: "Koç", image: "/images/tutors/demo-woman-4.jpg" }
  );
  assert.deepEqual(
    { name: onur.name, surname: onur.surname, image: onur.profile_picture },
    { name: "Onur", surname: "Taş", image: "/images/tutors/demo-onur-tas.jpg" }
  );
  assert.deepEqual(
    { name: kerem.name, surname: kerem.surname, image: kerem.profile_picture },
    { name: "Deniz", surname: "Özkan", image: "/images/tutors/demo-woman-3.jpg" }
  );
});

test("aligns the first advertising tutors with top-15k programmes", () => {
  const mehmet = tutor(
    "d4c3fa5d-3b99-45b1-b964-7a496a3dc56b",
    "Mehmet",
    "Demir",
    "/images/tutors/demo-man-3.jpg"
  );
  const nazli = tutor(
    "728ab84a-01dd-47ad-8b4b-2aec211d0679",
    "İbrahim",
    "Koç",
    "old.jpg"
  );
  const onur = tutor(
    "a017150a-81cd-4996-bbb3-776e71d7739f",
    "Onur",
    "Taş",
    "old.jpg"
  );

  const presentedMehmet = applyDemoTutorPresentation(mehmet);
  const presentedNazli = applyDemoTutorPresentation(nazli);
  const presentedOnur = applyDemoTutorPresentation(onur);

  assert.deepEqual(
    {
      university: presentedMehmet.university,
      department: presentedMehmet.department,
      rank: presentedMehmet.yks_rank,
      bio: presentedMehmet.bio,
      subjects: presentedMehmet.subjects.map(({ exam_type, name }) => `${exam_type} ${name}`),
    },
    {
      university: "Boğaziçi Üniversitesi",
      department: "Elektrik-Elektronik Mühendisliği",
      rank: 1240,
      bio: "Boğaziçi Üniversitesi Elektrik-Elektronik Mühendisliği öğrencisiyim. Matematik ve Fizik derslerinde YKS odaklı, soru çözümü ve kavramsal düşünmeyi birlikte ilerleten bir sistem uyguluyorum.",
      subjects: ["TYT Matematik", "AYT Matematik", "AYT Fizik"],
    }
  );
  assert.deepEqual(
    {
      university: presentedNazli.university,
      department: presentedNazli.department,
      rank: presentedNazli.yks_rank,
      bio: presentedNazli.bio,
      subjects: presentedNazli.subjects.map(({ exam_type, name }) => `${exam_type} ${name}`),
    },
    {
      university: "İstanbul Teknik Üniversitesi",
      department: "Uçak Mühendisliği",
      rank: 2100,
      bio: "İTÜ Uçak Mühendisliği öğrencisiyim. Matematik ve Fizik derslerinde temel kavramları mühendislik bakış açısıyla pekiştirip soru çözüm hızını artırmaya odaklanıyorum.",
      subjects: ["TYT Matematik", "AYT Matematik", "AYT Fizik"],
    }
  );
  assert.deepEqual(
    {
      university: presentedOnur.university,
      department: presentedOnur.department,
      rank: presentedOnur.yks_rank,
      bio: presentedOnur.bio,
      subjects: presentedOnur.subjects.map(({ exam_type, name }) => `${exam_type} ${name}`),
    },
    {
      university: "Hacettepe Üniversitesi",
      department: "Tıp",
      rank: 540,
      bio: "Hacettepe Tıp Fakültesi öğrencisiyim. Biyoloji ve Kimya derslerinde konuları neden-sonuç ilişkisiyle anlatıp YKS soru tipleri üzerinden kalıcı hale getiriyorum.",
      subjects: ["TYT Biyoloji", "AYT Biyoloji", "AYT Kimya"],
    }
  );
});

test("leaves unrelated tutors unchanged", () => {
  const unrelated = tutor("someone-else", "Ali", "Çelik", "ali.jpg");

  assert.equal(applyDemoTutorPresentation(unrelated), unrelated);
});

function review(index: number): Review {
  return {
    id: `review-${index}`,
    booking: `booking-${index}`,
    student: `student-${index}`,
    tutor: "backend-tutor-id",
    rating: 5,
    clarity_rating: 5,
    preparation_rating: 5,
    progress_rating: 5,
    confidence_rating: 5,
    comment: "Eski bölümle ilgili yorum",
    created_at: "2026-08-01T12:00:00Z",
    subject: { id: "old-subject", name: "Mantık", exam_type: "AYT" },
  };
}

test("rewrites demo review comments and subject badges for the selected programmes", () => {
  const mehmet = [0, 1, 2].map((index) =>
    applyDemoTutorReviewPresentation(
      "d4c3fa5d-3b99-45b1-b964-7a496a3dc56b",
      review(index),
      index
    )
  );
  const nazli = [0, 1, 2].map((index) =>
    applyDemoTutorReviewPresentation(
      "728ab84a-01dd-47ad-8b4b-2aec211d0679",
      review(index),
      index
    )
  );
  const onur = [0, 1, 2].map((index) =>
    applyDemoTutorReviewPresentation(
      "a017150a-81cd-4996-bbb3-776e71d7739f",
      review(index),
      index
    )
  );

  assert.deepEqual(
    mehmet.map(({ comment, subject }) => ({ comment, subject: `${subject?.exam_type} ${subject?.name}` })),
    [
      {
        comment: "Elektrik konularını formül ezberletmeden, mantığını kurarak anlattı; zor sorular çok daha anlaşılır oldu.",
        subject: "TYT Matematik",
      },
      {
        comment: "AYT Matematikte takıldığım soru tiplerini hızlıca belirleyip farklı çözüm yolları gösterdi.",
        subject: "AYT Matematik",
      },
      {
        comment: "Fizik ve matematik arasında bağlantı kurması konuları kalıcı hale getirdi.",
        subject: "AYT Fizik",
      },
    ]
  );
  assert.deepEqual(
    nazli.map(({ comment, subject }) => ({ comment, subject: `${subject?.exam_type} ${subject?.name}` })),
    [
      {
        comment: "Fizik sorularını mühendislik örnekleriyle açıklaması konuyu çok daha anlaşılır yaptı.",
        subject: "TYT Matematik",
      },
      {
        comment: "AYT Matematikte eksiklerimi hızlıca bulup düzenli bir soru çözüm planı oluşturdu.",
        subject: "AYT Matematik",
      },
      {
        comment: "Karmaşık problemleri adım adım ayırarak çözmesi hızımı ve güvenimi artırdı.",
        subject: "AYT Fizik",
      },
    ]
  );
  assert.deepEqual(
    onur.map(({ comment, subject }) => ({ comment, subject: `${subject?.exam_type} ${subject?.name}` })),
    [
      {
        comment: "Biyoloji konularını neden-sonuç ilişkisiyle anlattığı için ezberlemeden öğrenebildim.",
        subject: "TYT Biyoloji",
      },
      {
        comment: "AYT Biyoloji denemelerinde zorlandığım soru tiplerini kısa özetler ve seçilmiş sorularla netleştirdi.",
        subject: "AYT Biyoloji",
      },
      {
        comment: "AYT Kimyada zorlandığım başlıkları neden-sonuç ilişkisiyle açıklayıp hızlıca netleştirdi.",
        subject: "AYT Kimya",
      },
    ]
  );
});

test("keeps review summary subject labels consistent with the demo profile", () => {
  const summary: TutorReviewSummary = {
    overall_rating: 4.9,
    review_count: 38,
    criteria_ratings: {
      clarity: { label: "Anlatım", average: 4.8, count: 38 },
      preparation: { label: "Hazırlık", average: 4.8, count: 38 },
      progress: { label: "İlerleme", average: 4.8, count: 38 },
      confidence: { label: "Motivasyon", average: 4.8, count: 38 },
    },
    subject_ratings: [
      {
        subject: { id: "old-1", name: "Mantık", exam_type: "AYT" },
        average: 4.9,
        count: 18,
        percentage_of_reviews: 47.4,
      },
      {
        subject: { id: "old-2", name: "Matematik", exam_type: "TYT" },
        average: 4.8,
        count: 12,
        percentage_of_reviews: 31.6,
      },
      {
        subject: { id: "old-3", name: "Matematik", exam_type: "AYT" },
        average: 5,
        count: 8,
        percentage_of_reviews: 21,
      },
    ],
  };

  const presented = applyDemoTutorReviewSummaryPresentation(
    "a017150a-81cd-4996-bbb3-776e71d7739f",
    summary
  );

  assert.deepEqual(
    presented.subject_ratings.map(({ subject }) => `${subject.exam_type} ${subject.name}`),
    ["TYT Biyoloji", "AYT Biyoloji", "AYT Kimya"]
  );
  assert.equal(presented.criteria_ratings, summary.criteria_ratings);
});

test("never invents a subject id, because the booking form posts it back", () => {
  // Regression: the override used to replace `subjects` wholesale with rows
  // whose ids were strings like "demo-ayt-biyoloji". BookingModal posts the
  // selected id as `subject` to POST /api/bookings/, where it is a UUID
  // primary key, so every free-trial booking on a demo tutor failed.
  const demoTutorIds = [
    "d4c3fa5d-3b99-45b1-b964-7a496a3dc56b",
    "728ab84a-01dd-47ad-8b4b-2aec211d0679",
    "a017150a-81cd-4996-bbb3-776e71d7739f",
    "dd612b39-0a51-4f59-994d-27792312a96b",
  ];

  for (const id of demoTutorIds) {
    const presented = applyDemoTutorPresentation(tutor(id, "Ad", "Soyad", "old.jpg"));
    assert.deepEqual(
      presented.subjects.map((subject) => subject.id),
      REAL_SUBJECT_IDS,
      `${id} lost or rewrote its real subject ids`
    );
    for (const subject of presented.subjects) {
      assert.ok(!String(subject.id).startsWith("demo-"), `${id} produced a synthetic subject id`);
    }
  }
});

test("shows no subjects rather than inventing them when the tutor has none", () => {
  const bare = {
    id: "a017150a-81cd-4996-bbb3-776e71d7739f",
    name: "Onur",
    surname: "Taş",
    profile_picture: "old.jpg",
    subjects: [],
  } as unknown as TutorProfile;

  assert.deepEqual(applyDemoTutorPresentation(bare).subjects, []);
});

test("relabels a review without touching its subject id", () => {
  const presented = applyDemoTutorReviewPresentation(
    "a017150a-81cd-4996-bbb3-776e71d7739f",
    review(1),
    1
  );

  assert.equal(presented.subject?.id, "old-subject");
  assert.equal(`${presented.subject?.exam_type} ${presented.subject?.name}`, "AYT Biyoloji");
});

import type { Review, Subject, TutorProfile, TutorReviewSummary } from "@/types";

/** What a demo override is allowed to change about a subject: the words on
 * screen, never the identifier. `Subject.id` is a real database primary key
 * that the booking form posts back to the API, so a made-up value here is
 * not a presentation detail — it is an invalid write. An earlier version of
 * this file spread synthetic `demo-*` ids over `tutor.subjects`, which made
 * `POST /api/bookings/` fail for every demo tutor. Keeping the id out of
 * this type is what stops that from being expressible again. */
type SubjectLabel = Pick<Subject, "name" | "exam_type">;

type TutorPresentationOverride = Pick<
  TutorProfile,
  "name" | "surname" | "profile_picture"
> &
  Partial<Pick<TutorProfile, "university" | "department" | "yks_rank" | "bio">> & {
    subjects?: readonly SubjectLabel[];
  };

function label(name: string, examType: Subject["exam_type"]): SubjectLabel {
  return { name, exam_type: examType };
}

const MATHS_AND_PHYSICS: readonly SubjectLabel[] = [
  label("Matematik", "TYT"),
  label("Matematik", "AYT"),
  label("Fizik", "AYT"),
];

const MEDICINE: readonly SubjectLabel[] = [
  label("Biyoloji", "TYT"),
  label("Biyoloji", "AYT"),
  label("Kimya", "AYT"),
];

/** Relabel the tutor's REAL subjects in place, positionally. The array the
 * API returned decides both the length and every id; the override only
 * supplies wording, and only as far as it reaches. A tutor with no subjects
 * keeps none — inventing rows would put an unbookable option on screen. */
function relabelSubjects(
  real: TutorProfile["subjects"] | undefined,
  labels: readonly SubjectLabel[] | undefined
): TutorProfile["subjects"] {
  if (!real?.length) return real ?? [];
  if (!labels?.length) return real;
  return real.map((subject, index) => {
    const next = labels[index];
    return next ? { ...subject, name: next.name, exam_type: next.exam_type } : subject;
  });
}

const DEMO_REVIEW_COMMENTS: Readonly<Record<string, readonly string[]>> = {
  "d4c3fa5d-3b99-45b1-b964-7a496a3dc56b": [
    "Elektrik konularını formül ezberletmeden, mantığını kurarak anlattı; zor sorular çok daha anlaşılır oldu.",
    "AYT Matematikte takıldığım soru tiplerini hızlıca belirleyip farklı çözüm yolları gösterdi.",
    "Fizik ve matematik arasında bağlantı kurması konuları kalıcı hale getirdi.",
  ],
  "728ab84a-01dd-47ad-8b4b-2aec211d0679": [
    "Fizik sorularını mühendislik örnekleriyle açıklaması konuyu çok daha anlaşılır yaptı.",
    "AYT Matematikte eksiklerimi hızlıca bulup düzenli bir soru çözüm planı oluşturdu.",
    "Karmaşık problemleri adım adım ayırarak çözmesi hızımı ve güvenimi artırdı.",
  ],
  "a017150a-81cd-4996-bbb3-776e71d7739f": [
    "Biyoloji konularını neden-sonuç ilişkisiyle anlattığı için ezberlemeden öğrenebildim.",
    "AYT Biyoloji denemelerinde zorlandığım soru tiplerini kısa özetler ve seçilmiş sorularla netleştirdi.",
    "AYT Kimyada zorlandığım başlıkları neden-sonuç ilişkisiyle açıklayıp hızlıca netleştirdi.",
  ],
};

// These UUIDs belong to the fixed demo accounts used in public marketing shots.
// Keep the override at the presentation boundary so similarly named real tutors
// and other accounts sharing legacy demo assets are never affected.
const DEMO_TUTOR_OVERRIDES: Readonly<Record<string, TutorPresentationOverride>> = {
  "d4c3fa5d-3b99-45b1-b964-7a496a3dc56b": {
    name: "Mehmet",
    surname: "Demir",
    profile_picture: "/images/tutors/demo-man-3.jpg",
    university: "Boğaziçi Üniversitesi",
    department: "Elektrik-Elektronik Mühendisliği",
    yks_rank: 1240,
    bio: "Boğaziçi Üniversitesi Elektrik-Elektronik Mühendisliği öğrencisiyim. Matematik ve Fizik derslerinde YKS odaklı, soru çözümü ve kavramsal düşünmeyi birlikte ilerleten bir sistem uyguluyorum.",
    subjects: MATHS_AND_PHYSICS,
  },
  "728ab84a-01dd-47ad-8b4b-2aec211d0679": {
    name: "Nazlı",
    surname: "Koç",
    profile_picture: "/images/tutors/demo-woman-4.jpg",
    university: "İstanbul Teknik Üniversitesi",
    department: "Uçak Mühendisliği",
    yks_rank: 2100,
    bio: "İTÜ Uçak Mühendisliği öğrencisiyim. Matematik ve Fizik derslerinde temel kavramları mühendislik bakış açısıyla pekiştirip soru çözüm hızını artırmaya odaklanıyorum.",
    subjects: MATHS_AND_PHYSICS,
  },
  "a017150a-81cd-4996-bbb3-776e71d7739f": {
    name: "Onur",
    surname: "Taş",
    profile_picture: "/images/tutors/demo-onur-tas.jpg",
    university: "Hacettepe Üniversitesi",
    department: "Tıp",
    yks_rank: 540,
    bio: "Hacettepe Tıp Fakültesi öğrencisiyim. Biyoloji ve Kimya derslerinde konuları neden-sonuç ilişkisiyle anlatıp YKS soru tipleri üzerinden kalıcı hale getiriyorum.",
    subjects: MEDICINE,
  },
  "dd612b39-0a51-4f59-994d-27792312a96b": {
    name: "Deniz",
    surname: "Özkan",
    profile_picture: "/images/tutors/demo-woman-3.jpg",
  },
};

export function applyDemoTutorPresentation(tutor: TutorProfile): TutorProfile {
  const override = DEMO_TUTOR_OVERRIDES[tutor.id];
  if (!override) return tutor;
  const { subjects: subjectLabels, ...rest } = override;
  return {
    ...tutor,
    ...rest,
    subjects: relabelSubjects(tutor.subjects, subjectLabels),
  };
}

export function applyDemoTutorReviewPresentation(
  tutorId: string,
  review: Review,
  index: number
): Review {
  const comments = DEMO_REVIEW_COMMENTS[tutorId];
  const labels = DEMO_TUTOR_OVERRIDES[tutorId]?.subjects;
  if (!comments || !labels?.length) return review;

  const next = labels[index % labels.length];
  return {
    ...review,
    comment: comments[index % comments.length],
    // The review's own subject row keeps its id; only the wording changes.
    subject: review.subject
      ? { ...review.subject, name: next.name, exam_type: next.exam_type }
      : review.subject,
  };
}

export function applyDemoTutorReviewSummaryPresentation(
  tutorId: string,
  summary: TutorReviewSummary
): TutorReviewSummary {
  const labels = DEMO_TUTOR_OVERRIDES[tutorId]?.subjects;
  if (!labels?.length) return summary;

  // Relabel the ratings that exist. The old version mapped over the override
  // instead and synthesised a rating row per demo subject, which both invented
  // ids and could report ratings for subjects the tutor has none for.
  return {
    ...summary,
    subject_ratings: summary.subject_ratings.map((rating, index) => {
      const next = labels[index];
      return next
        ? { ...rating, subject: { ...rating.subject, name: next.name, exam_type: next.exam_type } }
        : rating;
    }),
  };
}

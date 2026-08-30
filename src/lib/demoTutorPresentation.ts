import type { Review, Subject, TutorProfile, TutorReviewSummary } from "@/types";

type TutorPresentationOverride = Pick<
  TutorProfile,
  "name" | "surname" | "profile_picture"
> &
  Partial<
    Pick<
      TutorProfile,
      "university" | "department" | "yks_rank" | "bio" | "subjects"
    >
  >;

function subject(id: string, name: string, examType: Subject["exam_type"]): Subject {
  return { id: `demo-${id}`, name, exam_type: examType };
}

const MATHS_AND_PHYSICS = [
  subject("tyt-matematik", "Matematik", "TYT"),
  subject("ayt-matematik", "Matematik", "AYT"),
  subject("ayt-fizik", "Fizik", "AYT"),
];

const MEDICINE = [
  subject("tyt-biyoloji", "Biyoloji", "TYT"),
  subject("ayt-biyoloji", "Biyoloji", "AYT"),
  subject("ayt-kimya", "Kimya", "AYT"),
];

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
  return override ? { ...tutor, ...override } : tutor;
}

export function applyDemoTutorReviewPresentation(
  tutorId: string,
  review: Review,
  index: number
): Review {
  const comments = DEMO_REVIEW_COMMENTS[tutorId];
  const subjects = DEMO_TUTOR_OVERRIDES[tutorId]?.subjects;
  if (!comments || !subjects?.length) return review;

  return {
    ...review,
    comment: comments[index % comments.length],
    subject: subjects[index % subjects.length],
  };
}

export function applyDemoTutorReviewSummaryPresentation(
  tutorId: string,
  summary: TutorReviewSummary
): TutorReviewSummary {
  const subjects = DEMO_TUTOR_OVERRIDES[tutorId]?.subjects;
  if (!subjects?.length) return summary;

  return {
    ...summary,
    subject_ratings: subjects.map((demoSubject, index) => {
      const existing = summary.subject_ratings[index];
      return existing
        ? { ...existing, subject: demoSubject }
        : {
            subject: demoSubject,
            average: summary.overall_rating,
            count: summary.review_count,
            percentage_of_reviews: summary.review_count > 0 ? 100 : 0,
          };
    }),
  };
}

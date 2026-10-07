import type { ReactNode } from "react";

/**
 * Every sentence the homepage says, in one place.
 *
 * Components import their strings from here; Turkish text does not live in
 * their JSX. Rewriting the page's copy means editing this file and nothing
 * else.
 *
 * Numbers never appear here as literals. They come from `ysHomeFacts.ts`, and
 * an entry that contains one is a small function the component calls with the
 * value. Where the value can still be an undecided `TODO`, the function takes
 * a `ReactNode`, so the component can pass a `<YsFact>` that renders the
 * placeholder in development.
 *
 * One export per section, in page order. Sections land phase by phase
 * (docs/design/product-home/homepage-rebuild/HOCAM_HOMEPAGE_PLAN.md); the ones
 * not built yet (students, pricing, guarantees, parents, tutors,
 * testimonialsTitle, faq, footer) are added with their task.
 */

export const hero = {
  titleLine1: "Dünün öğrencisi,",
  titleLine2: "bugünün öğretmeni",
  sub: "YKS'de derece yapmış öğrencileri, derece yapacaklarla buluşturuyoruz.",
  ctaTutors: "Hocaları gör",
  ctaBecomeTutor: "Hoca ol",
  audienceLabel: "Senin için olan kısma atla",
  audience: {
    students: "Ders almak istiyorum",
    parents: "Velisiyim",
    tutors: "Hoca olmak istiyorum",
  },
} as const;

export const subjects = {
  title: "Hangi dersler var?",
  sub: "Dersine tıkla, o dersi veren hocaları gör.",
  coaching: "YKS koçluğu",
} as const;

export const band = {
  title: "Belgesi olmayan kimse ders veremez",
  lead: "Öğrenci kimliği, YKS sonuç belgesi ve üniversite e-posta adresi tek tek kontrol edilir.",
  rankBadge: (maxRank: string) => `İlk ${maxRank}`,
  eligibility: (rankBadge: ReactNode): ReactNode[] => [
    "Sadece YKS'de ",
    rankBadge,
    " içine girmiş öğrenciler hoca olabilir.",
  ],
  cta: "Nasıl doğruluyoruz?",
  checklistTitle: "Her hoca başvurusunda kontrol ettiklerimiz",
  /* The three TutorVerification documents, in the model's order. */
  checklist: [
    { label: "Öğrenci kimliği", sub: "Hâlâ üniversitede okuduğunu gösterir." },
    { label: "YKS sonuç belgesi", sub: "Profilde yazan sıralamanın kaynağı." },
    { label: ".edu.tr e-posta adresi", sub: "Hangi üniversitede olduğunu doğrular." },
  ],
  checklistFoot: (f: { reviewDays: ReactNode; docsDeletedAfter: ReactNode }): ReactNode[] => [
    "Başvurular ",
    f.reviewDays,
    " gün içinde sonuçlanır. Belgeler profilde hiçbir zaman görünmez ve ",
    f.docsDeletedAfter,
    " sonra silinir.",
  ],
} as const;

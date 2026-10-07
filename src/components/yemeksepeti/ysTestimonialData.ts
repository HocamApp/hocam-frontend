/**
 * Testimonials for the rebuilt homepage (NEXT_PUBLIC_HOME_V2).
 *
 * docs/rebrand-handover.md records that these are not real students and that
 * the owners chose to keep them. DESIGN.md bans fake testimonials, so every
 * entry starts unapproved and only `approved: true` renders: Baha re-decides
 * each one. A group with no approved entries does not render at all.
 *
 * Quotes are verbatim from the original site; do not reword them. Bahadir's
 * entry is deleted here on purpose (plan T10). The plan names this file ysTestimonials.ts; that collides with
 * YsTestimonials.tsx on a case-insensitive filesystem. The flag-off homepage still
 * runs its own list in YsTestimonials.tsx, unchanged.
 */
export interface YsTestimonial {
  id: string;
  name: string;
  role: "student" | "tutor";
  /** Grade for a student; university, department and rank for a tutor. */
  meta: string;
  quote: string;
  photo: string;
  /** The tutor's public profile, when the quote belongs to a listed tutor. */
  tutorProfileId?: string;
  approved: boolean;
}

export const TESTIMONIALS: YsTestimonial[] = [
  {
    id: "selin",
    name: "Selin",
    role: "tutor",
    meta: "ODTÜ Endüstri Müh., YKS sıralaması 5.400",
    quote:
      "Bizim lisede bir abi vardı, herkes ona soru sorardı. Ben de biraz onun gibi olmak istedim; şimdi haftada birkaç saat ders veriyorum, hem para kazanıyorum hem de anlattığım konu daha da pekişiyor bende.",
    photo: "/images/testimonials/selin.jpeg",
    approved: false,
  },
  {
    id: "zeynep",
    name: "Zeynep",
    role: "tutor",
    meta: "Boğaziçi Bilgisayar Müh., YKS sıralaması 3.100",
    quote:
      "Mezun olunca kitapları atacaktım normalde, hepsi çöpe gidecekti. Şimdi hem kendi bilgim işime yarıyor hem de üniversite masraflarımı çıkarıyorum.",
    photo: "/images/testimonials/zeynep.jpeg",
    approved: false,
  },
  {
    id: "kaan",
    name: "Kaan",
    role: "student",
    meta: "12. sınıf",
    quote:
      "Dershanede hoca konuyu anlatıyor ama sınavda nasıl çıkacağını bilmiyordu resmen. Burdaki abi geçen sene aynı soruları çözmüş, o yüzden nereye dikkat etmem gerektiğini biliyo.",
    photo: "/images/testimonials/kaan.jpeg",
    approved: false,
  },
  {
    id: "elif",
    name: "Elif",
    role: "student",
    meta: "11. sınıf",
    quote:
      "Özel ders parası ailemize yük oluyordu direkt. Burda saatlik fiyat neredeyse yarı yarıya, üstüne hoca da yaşça bana yakın olunca daha rahat soru sorabiliyorum.",
    photo: "/images/testimonials/elif.jpeg",
    approved: false,
  },
  {
    id: "nazli",
    name: "Nazli",
    role: "student",
    meta: "12. sınıf",
    quote:
      "3 aydır matematik dersi alıyorum, netlerim 18'den 27'ye çıktı. Hocam bana özellikle hangi konuda takıldığımı görüp ona göre gidiyor, okuldaki gibi herkese aynı şey anlatmıyor.",
    photo: "/images/testimonials/nazli.jpeg",
    approved: false,
  },
];

export function approvedTestimonials(
  role: YsTestimonial["role"],
  entries: readonly YsTestimonial[] = TESTIMONIALS,
): YsTestimonial[] {
  return entries.filter((entry) => entry.approved && entry.role === role);
}

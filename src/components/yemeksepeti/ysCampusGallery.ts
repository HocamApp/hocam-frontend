import type { CircularGalleryItem } from "@/components/ui/circular-gallery";

/**
 * The universities on the hero carousel.
 *
 * Illustrations rather than photographs, and drawn rather than sourced: a
 * marketplace whose whole claim is verified rank cannot put a stock photo of a
 * campus it has no relationship with on its front page.
 *
 * Six, because six is what fits a circle at this radius without the cards
 * overlapping into an unreadable stack. They are the schools our verified
 * tutors most often come from, so the ring is a claim the directory below can
 * actually back up.
 */
export const YS_CAMPUS_ITEMS: CircularGalleryItem[] = [
  {
    title: "Boğaziçi Üniversitesi",
    subtitle: "İstanbul",
    image: "/images/universities/campus/bogazici.jpg",
    alt: "Boğaziçi Üniversitesi'nin Boğaz'a bakan güney kampüsü",
  },
  {
    title: "Orta Doğu Teknik Üniversitesi",
    subtitle: "Ankara",
    image: "/images/universities/campus/odtu.jpg",
    alt: "ODTÜ kampüs girişindeki tabela ve heykel",
  },
  {
    title: "İstanbul Teknik Üniversitesi",
    subtitle: "İstanbul",
    image: "/images/universities/campus/itu.jpg",
    alt: "İTÜ kampüs girişi ve 1773 amblemi",
  },
  {
    title: "Koç Üniversitesi",
    subtitle: "İstanbul",
    image: "/images/universities/campus/koc.jpg",
    alt: "Koç Üniversitesi'nin ormanla çevrili kampüsü ve saat kulesi",
  },
  {
    title: "Bilkent Üniversitesi",
    subtitle: "Ankara",
    image: "/images/universities/campus/bilkent.jpg",
    alt: "Bilkent Üniversitesi kampüsünün havadan görünümü",
  },
  {
    title: "Yıldız Teknik Üniversitesi",
    subtitle: "İstanbul",
    image: "/images/universities/campus/yildiz-teknik.jpg",
    alt: "Yıldız Teknik Üniversitesi kampüsünün havadan görünümü",
  },
];

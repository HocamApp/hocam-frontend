import {
  VerticalTabs,
  type VerticalTabItem,
} from "@/components/ui/vertical-tabs";

const JOURNEY_STEPS: VerticalTabItem[] = [
  {
    id: "01",
    title: "Hocanı bul",
    description:
      "İstediğin dersi ve üniversite ile filtrele, hocaları karşılaştır, sana uygun olanı seç.",
    imageSrc: "/images/how-it-works/01-tutor-list.png",
    imageAlt: "Hoca listesindeki filtreler ve hoca kartları",
  },
  {
    id: "02",
    title: "Deneme dersiyle tanış",
    description: "İlk dersi ücretsiz dene, tarzını beğendiğinden emin ol.",
    imageSrc: "/images/how-it-works/02-nazli-profile.png",
    imageAlt: "Nazlı Koç'un hoca profili",
  },
  {
    id: "03",
    title: "Paketini seç",
    description: "Sana uygun süreci belirle, indirimli paketini al.",
    imageSrc: "/images/how-it-works/03-package-selection.png",
    imageAlt: "Ders paketi ve paket süresi seçim ekranı",
  },
  {
    id: "04",
    title: "Platformdan derse gir",
    description:
      "Hocam'ın kendi video altyapısı üzerinden, tek tıkla dersine bağlan.",
    imageSrc: "/images/how-it-works/04-lesson-dashboard.png",
    imageAlt: "Öğrenci panelindeki derse katılma alanı",
  },
];

export function YsHowItWorks() {
  return (
    <VerticalTabs
      className="mt-16 md:mt-24"
      heading={
        <>
          <span className="block">Hocanı bul.</span>
          {" "}
          <span className="block italic">Gerisi kolay.</span>
        </>
      }
      intro="Sana uygun hocayı filtrele, ücretsiz deneme dersiyle tanış, paketini seç. Hocam’ın platformu üzerinden, tek tıkla derse katıl."
      items={JOURNEY_STEPS}
      autoplayMs={5_000}
    />
  );
}

import {
  VerticalTabs,
  type VerticalTabItem,
} from "@/components/ui/vertical-tabs";

import { YsJourneyHeading } from "./YsJourneyHeading";
import { JOURNEY_SECTION_ID } from "./ysAppNav";

const JOURNEY_STEPS: VerticalTabItem[] = [
  {
    id: "01",
    title: "Hocanı bul",
    description:
      "İstediğin dersi veya üniversiteyi filtrele, hocaları karşılaştır, sana uygun olanı seç.",
    imageSrc: "/images/how-it-works/01-tutor-list.png",
    imageAlt: "Hoca listesindeki filtreler ve hoca kartları",
  },
  {
    id: "02",
    title: "Deneme dersiyle tanış",
    description: "İlk dersini ücretsiz dene, hocanı beğendiğinden emin ol.",
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

/**
 * The journey sits on its own full-bleed band.
 *
 * DESIGN.md separates sections by colour, not by containers: a band, no
 * border, no shadow, no wrapper. Section padding is the documented rhythm,
 * 96 desktop and 64 mobile.
 *
 * `--surface` rather than `--pink-pale`, because the testimonials directly
 * underneath already own the one permitted pale-pink section surface and two
 * pale bands in a row stop separating anything. White on paper is the same
 * value step the cards use, held at section scale, and it is themed, so
 * Night mode gets #182225 for free where a fixed campaign surface would have
 * needed pinned ink.
 *
 * Gold and pink were both tried here and rejected. Gold cannot carry white
 * type at all (1.46:1) and its compliant pairing is `--gold-ink`; pink can
 * (4.05:1) but would have made this the page's second full-bleed pink band,
 * against a 20 to 30% budget. A themed neutral needs neither exception.
 */
export function YsHowItWorks() {
  return (
    <div
      id={JOURNEY_SECTION_ID}
      /* The sticky header would otherwise cover the heading when the nav
         scrolls here. */
      className="scroll-mt-[calc(var(--app-header-h)+24px)] bg-surface py-16 md:py-24"
    >
      <div className="ys-shell">
        <VerticalTabs
          heading={<YsJourneyHeading />}
          items={JOURNEY_STEPS}
          autoplayMs={5_000}
        />
      </div>
    </div>
  );
}

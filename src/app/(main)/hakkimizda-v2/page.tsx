import type { Metadata } from "next";
import AboutSection1 from "@/components/ui/about-section-1";

import { AboutSection, AboutShell } from "@/components/about/AboutSection";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline";

/**
 * A richer take on the About page, kept beside the existing `/hakkimizda`
 * rather than replacing it so the two can be compared before anything on the
 * live site moves.
 *
 * Noindex on purpose: while both pages exist they would compete for the same
 * query. Drop the robots block when this one takes over.
 *
 * The story is the founders' own; the mission, vision and values are written
 * from what the product actually does. There is deliberately no statistics
 * band — the reference page this borrows its shape from leads with "212.000+
 * öğrenci", and Hocam has no such number to show. Inventing one is the single
 * easiest way to make a page like this dishonest.
 */

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "Hocam'ı kimler, neden kurdu? Hikayemiz, misyonumuz ve YKS öğrencileri için doğrulanmış hoca pazaryeri kurma nedenimiz.",
  robots: { index: false, follow: true },
};

/**
 * `status: "done"` marks what has happened; the last entry is the one that has
 * not. It renders muted, with an open dot and a dimmed connector, so the page
 * never states an ambition as if it were a fact.
 */
const TIMELINE = [
  {
    period: "Lise yılları",
    title: "Mersin Eyüp Aygar Fen Lisesi",
    body: "Aynı okulda tanıştık, aynı sınavlara birlikte hazırlandık. O yıllarda gördük ki bir öğrencinin nereye gideceğini çoğu zaman kapasitesi değil, hangi hocaya ulaşabildiği belirliyor.",
    status: "done" as const,
  },
  {
    period: "Üniversite",
    title: "Sınavda derece, aklımızda aynı soru",
    body: "Üçümüz de YKS'de derece yaptık. İkimiz Yıldız Teknik Üniversitesi'ne, birimiz Amerika'da Lafayette College'a gitti. Kendi hocalarımızı bulurken ne kadar şansa bağlı ilerlediğimizi ancak o zaman fark ettik.",
    status: "done" as const,
  },
  {
    period: "2026",
    title: "Hocam kuruldu",
    body: "Bir öğrencinin, kendi şehrinde bulamadığı hocaya birkaç dakikada ulaşabilmesi için yola çıktık. Doğrulanmış profiller, açık ücretler ve tek bir karşılaştırma ekranı.",
    status: "current" as const,
  },
  {
    period: "2028 · Hedefimiz",
    title: "Her ilden bir öğrencinin ulaşabildiği bir yer",
    body: "Hedefimiz, Türkiye'nin her ilinden öğrencinin aradığı hocayı bulabildiği, hazırlık sürecinin coğrafyaya bağlı kalmadığı bir platform olmak. Henüz oraya varmadık; yolun neresinde olduğumuzu açık tutacağız.",
    status: "upcoming" as const,
  },
] as const;

export default function AboutV2Page() {
  return (
    <article className="pb-10">
      <AboutSection1 />
      <AboutShell>
        <AboutSection
          eyebrow="HİKAYEMİZ"
          title="Hocam'ın tohumları nerede atıldı?"
          lede="Üç kurucu, aynı sıralarda başlayan ve aynı soruda birleşen bir yol."
        >
          <Timeline>
            {TIMELINE.map((item, index) => {
              const done = item.status === "done";
              const upcoming = item.status === "upcoming";
              const isLast = index === TIMELINE.length - 1;

              return (
                <TimelineItem key={item.period} status={done ? "done" : "default"}>
                  <TimelineHeading
                    className={`line-clamp-none whitespace-normal text-lg font-semibold ${
                      upcoming ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {item.title}
                  </TimelineHeading>

                  <TimelineDot
                    status={done ? "done" : item.status === "current" ? "current" : "default"}
                    className={upcoming ? "border-dashed opacity-60" : undefined}
                  />

                  {!isLast && <TimelineLine done={done} />}

                  <TimelineContent className={upcoming ? "opacity-70" : undefined}>
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-300">
                      {item.period}
                    </span>
                    <p className="mt-1.5 max-w-2xl leading-7">{item.body}</p>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </AboutSection>

      </AboutShell>
    </article>
  );
}

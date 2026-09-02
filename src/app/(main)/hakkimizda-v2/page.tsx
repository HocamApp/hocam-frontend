import type { Metadata } from "next";
import AboutSection1 from "@/components/ui/about-section-1";
import { AboutPrinciples } from "@/components/about/AboutPrinciples";
import { AboutInvitation } from "@/components/about/AboutInvitation";

import { Check } from "@phosphor-icons/react/dist/ssr";
import styles from "./page.module.css";
import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline";

// Keep the preview page out of search results until it replaces /hakkimizda.
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
    body: "Aynı okulda tanıştık, aynı sınavlara birlikte hazırlandık. İhtiyacımıza uygun bir hocaya ulaşmanın sınava hazırlık sürecini ne kadar değiştirdiğini o yıllarda gördük.",
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
      <section className={styles.story} aria-labelledby="about-foundations">
        <header className={styles.header}>
          <h2 id="about-foundations" className={styles.title}>Hocam&apos;ın temelleri nerede atıldı?</h2>
          <p className={styles.lede}>Üç kurucu, aynı sıralarda başlayan ve aynı soruda birleşen bir yol.</p>
        </header>
        <Timeline>
          {TIMELINE.map((item, index) => {
            const done = item.status === "done";
            const current = item.status === "current";
            const upcoming = item.status === "upcoming";

            return (
              <TimelineItem key={item.period} className={styles.item}>
                <TimelineHeading className={`${styles.stepTitle} ${upcoming ? styles.upcomingTitle : ""}`}>
                  {item.title}
                </TimelineHeading>
                <TimelineDot
                  status="custom"
                  customIcon={done ? <Check size={12} weight="regular" aria-hidden="true" /> : <span className={current ? styles.currentCenter : undefined} />}
                  className={`${styles.dot} ${done ? styles.doneDot : current ? styles.currentDot : styles.upcomingDot}`}
                  aria-label={done ? "Tamamlandı" : current ? "Şu an" : "Hedef"}
                />
                {index < TIMELINE.length - 1 && <TimelineLine className={`${styles.line} ${done ? styles.doneLine : ""}`} />}
                <TimelineContent className={styles.content}>
                  <span className={styles.period}>{item.period}</span>
                  <p className={styles.body}>{item.body}</p>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </section>
      <AboutPrinciples />
      <AboutInvitation />
    </article>
  );
}

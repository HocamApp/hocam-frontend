import {
  Compass,
  GraduationCap,
  UserFocus,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";

import {
  MAX_TUTOR_YKS_RANK,
  TRIAL_MINUTES,
} from "@/components/yemeksepeti/ysHomeFacts";

import styles from "./about-continuation.module.css";

const DIFFERENCES = [
  {
    id: "rank",
    icon: GraduationCap,
    title: `İlk ${MAX_TUTOR_YKS_RANK}’e giren hocalar`,
    description:
      `Hocam’da yalnızca YKS’de ilk ${MAX_TUTOR_YKS_RANK}’e giren üniversiteliler ders verir. Sıralamaları ve öğrencilik bilgileri belgelerle doğrulanır.`,
  },
  {
    id: "choice",
    icon: UserFocus,
    title: "Hocanı tanı, kendin seç",
    description:
      "Hocaların profillerini incele, eğitimlerini ve derslerini karşılaştır. Tanıştıktan sonra kiminle devam edeceğine sen karar ver.",
  },
  {
    id: "trial",
    icon: VideoCamera,
    title: "Tanışma dersi ücretsiz",
    description:
      `Deneme dersi sunan hocalarla ${TRIAL_MINUTES} dakika ücretsiz görüş. Aklındaki soruları sor, anlatımını tanı; ders paketi almadan önce sana uygun olup olmadığını gör.`,
  },
  {
    id: "coaching",
    icon: Compass,
    title: "Ders hocan, aynı zamanda koçun",
    description:
      "Koçluk sunan bir hocayla çalıştığında, ders paketine koçluğu da ekleyebilirsin. Çalışma planını ve denemelerini, derslerde seni tanıyan aynı hocayla değerlendirirsin.",
  },
] as const;

export function AboutPrinciples() {
  return (
    <section className={styles.approach} aria-labelledby="about-principles">
      <div className={styles.differences}>
        <h2 className={`${styles.title} ${styles.differencesTitle}`} id="about-principles">
          Hocam’ı farklı kılan ne?
        </h2>
        <ul className={styles.featureGrid}>
          {DIFFERENCES.map(({ id, icon: Icon, title, description }) => (
            <li key={id} className={styles.feature}>
              <Icon className={styles.featureIcon} size={28} weight="regular" aria-hidden="true" />
              <div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDescription}>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

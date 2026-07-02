"use client";

import { ChevronDown, Search } from "lucide-react";
import { motion, type MotionStyle } from "framer-motion";
import { cn } from "@/lib/utils";
import styles from "./HeroTutorsMockup.module.css";

const mockTutors = [
  {
    initials: "YD",
    name: "Yusuf Doğan",
    meta: "Boğaziçi Üniversitesi · Matematik",
    rank: "214",
    subjects: ["Matematik", "Geometri"],
    reviews: "18 değerlendirme",
    price: "₺1.160",
  },
  {
    initials: "İK",
    name: "İbrahim Koç",
    meta: "Orta Doğu Teknik Üniversitesi · Elektrik-Elektronik",
    rank: "486",
    subjects: ["Türkçe", "Matematik"],
    reviews: "11 değerlendirme",
    price: "₺1.970",
  },
  {
    initials: "DA",
    name: "Deniz Aydın",
    meta: "İstanbul Teknik Üniversitesi · Endüstri Mühendisliği",
    rank: "1.024",
    subjects: ["Geometri", "Türkçe"],
    reviews: "9 değerlendirme",
    price: "₺1.160",
  },
];

const mockSelects = [
  { label: "Sıralama", value: "En yüksek puan" },
  { label: "Sınav", value: "Tüm sınavlar" },
  { label: "Ders", value: "Tüm dersler" },
];

interface HeroTutorsMockupProps {
  /** Scroll-driven opacity/filter/scale for the whole overlay; omit for a static, fully visible mockup. */
  overlayStyle?: MotionStyle;
  /** Scroll-driven y offset simulating in-page scrolling; omit for a static mockup. */
  contentStyle?: MotionStyle;
  /** Extra class for the inner scroll surface — the full-page instance uses it for navbar-safe top padding. */
  scrollClassName?: string;
}

export function HeroTutorsMockup({
  overlayStyle,
  contentStyle,
  scrollClassName,
}: HeroTutorsMockupProps) {
  return (
    <motion.div className={styles.reveal} style={overlayStyle} aria-hidden>
      <motion.div className={cn(styles.scroll, scrollClassName)} style={contentStyle}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTitle}>Hocanı Bul</div>
          <p className={styles.pageSub}>
            Türkiye&apos;nin en iyi YKS hocaları, seni bekliyor.
          </p>
          <span className={styles.pageCount}>3 hoca bulundu</span>
        </div>

        <div className={styles.filterPanel}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Arama</span>
            <div className={styles.searchBox}>
              <Search size={14} />
              <span>Hoca ara...</span>
            </div>
          </div>
          <div className={styles.filterRow}>
            {mockSelects.map((select) => (
              <div className={styles.filterField} key={select.label}>
                <span className={styles.filterLabel}>{select.label}</span>
                <div className={styles.selectBox}>
                  <span>{select.value}</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cardGrid}>
          {mockTutors.map((tutor) => (
            <div className={styles.card} key={tutor.name}>
              <div className={styles.cardTop}>
                <span className={styles.avatar}>{tutor.initials}</span>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{tutor.name}</span>
                  <span className={styles.cardMeta}>{tutor.meta}</span>
                  <span className={styles.cardMeta}>
                    YKS Sıralaması: {tutor.rank}
                  </span>
                </div>
              </div>
              <div className={styles.badgeRow}>
                {tutor.subjects.map((subject) => (
                  <span className={styles.badge} key={subject}>
                    {subject}
                  </span>
                ))}
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.rating}>
                  <strong>★ 5.0</strong>
                  <span>({tutor.reviews})</span>
                </span>
                <span className={styles.price}>
                  <strong>{tutor.price}</strong>
                  <span>/saat</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

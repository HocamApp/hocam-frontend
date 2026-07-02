"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Download,
  Globe2,
  Keyboard,
  LogIn,
  Menu,
  Mic,
  Monitor,
  PanelsTopLeft,
  Play,
  Plus,
  Smartphone,
  Sparkles,
  UserPlus,
  WandSparkles,
} from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { HeroTutorsMockup } from "./HeroTutorsMockup";
import styles from "./WisprReferencePage.module.css";

const navLinks = [
  { label: "Hocalar", href: "/tutors" },
  { label: "Nasıl Çalışır", href: "#flow-reference-demo" },
  { label: "Dersler", href: "/tutors" },
  { label: "Yorumlar", href: "#testimonials" },
  { label: "Destek", href: "/support" },
];
const platformPills = ["Mac", "Windows", "iPhone", "Android"];
const universityLogos = [
  { name: "ODTÜ", logoSrc: "/landing/university-logos/odtu.svg", alt: "ODTÜ logosu" },
  { name: "İTÜ", logoSrc: "/landing/university-logos/itu.png", alt: "İTÜ logosu" },
  { name: "YTÜ", logoSrc: "/landing/university-logos/ytu.svg", alt: "YTÜ logosu" },
  {
    name: "Boğaziçi",
    logoSrc: "/landing/university-logos/bogazici.svg",
    alt: "Boğaziçi Üniversitesi logosu",
  },
  {
    name: "Koç",
    logoSrc: "/landing/university-logos/koc.svg",
    alt: "Koç Üniversitesi logosu",
  },
  {
    name: "Sabancı",
    logoSrc: "/landing/university-logos/sabanci.svg",
    alt: "Sabancı Üniversitesi logosu",
  },
  {
    name: "Bilkent",
    logoSrc: "/landing/university-logos/bilkent.png",
    alt: "Bilkent Üniversitesi logosu",
  },
  {
    name: "Hacettepe",
    logoSrc: "/landing/university-logos/hacettepe.svg",
    alt: "Hacettepe Üniversitesi logosu",
  },
  {
    name: "Ege Üniversitesi",
    logoSrc: "/landing/university-logos/ege.svg",
    alt: "Ege Üniversitesi logosu",
  },
  {
    name: "İstanbul Üniversitesi",
    logoSrc: "/landing/university-logos/istanbul.png",
    alt: "İstanbul Üniversitesi logosu",
  },
];
const tutorDiscoveryPills = [
  "YKS",
  "TYT",
  "AYT",
  "Matematik",
  "Fizik",
  "Türkçe",
  "İngilizce",
  "Lise",
  "Ortaokul",
];

const tutorJourneyTabs = [
  {
    title: "Hoca keşfi",
    eyebrow: "01 / Hedefini seç",
    heading: "Ders, sınav ve seviyene göre doğru hocaları daralt.",
    body: "YKS hazırlığı, TYT netleri, AYT konuları veya okul desteği için aradığın dersi ve seviyeyi seç; karşına daha uygun profiller gelsin.",
    chips: ["Matematik", "TYT", "AYT", "Online"],
    stats: [
      { label: "Sınav odağı", value: "TYT + AYT" },
      { label: "Ders formatı", value: "Online / yüz yüze" },
    ],
  },
  {
    title: "Profilleri karşılaştır",
    eyebrow: "02 / Kararını netleştir",
    heading: "Puan, yorum, deneyim ve ücreti tek akışta karşılaştır.",
    body: "Hocaların üniversite, bölüm, ders alanı, öğrenci yorumları ve saatlik ücret bilgilerini yan yana değerlendir.",
    chips: ["Puan", "Yorum", "Ücret", "Deneyim"],
    stats: [
      { label: "Ortalama puan", value: "4.9" },
      { label: "Öğrenci yorumu", value: "120+" },
    ],
  },
  {
    title: "Dersini planla",
    eyebrow: "03 / Ritmini kur",
    heading: "Uygun zamanı seç, ders planını güvenle oluştur.",
    body: "Hedefine, bütçene ve haftalık çalışma temposuna göre düzenli ilerleyebileceğin bir ders akışı kur.",
    chips: ["Haftalık plan", "Bütçe", "Takip", "Hedef"],
    stats: [
      { label: "Plan aralığı", value: "14 gün" },
      { label: "Ders süresi", value: "45 / 60 / 90 dk" },
    ],
  },
];

const hocamDifferenceItems = [
  {
    title: "Sınava göre filtrele",
    body: "YKS, TYT, AYT veya okul derslerine göre ihtiyacın olan desteği netleştir.",
  },
  {
    title: "Derse göre eşleştir",
    body: "Matematikten İngilizceye, aradığın alanda uygun hoca seçeneklerini keşfet.",
  },
  {
    title: "Kararını rahat ver",
    body: "Puan, yorum, deneyim ve saatlik ücretleri karşılaştırarak daha bilinçli seçim yap.",
  },
  {
    title: "Planını kolay kur",
    body: "Uygun zamanı seç, ders ritmini oluştur ve hedeflerine düzenli ilerle.",
  },
];

const appIcons = [
  { label: "N", color: "#6f5cff", x: "4%", y: "78%", rotate: "-17deg" },
  { label: "F", color: "#7458ff", x: "13%", y: "72%", rotate: "-12deg" },
  { label: "W", color: "#1ab56f", x: "22%", y: "65%", rotate: "-8deg" },
  { label: "S", color: "#f05d42", x: "32%", y: "57%", rotate: "-3deg" },
  { label: "G", color: "#f46a43", x: "43%", y: "48%", rotate: "8deg" },
  { label: "D", color: "#4b88ff", x: "54%", y: "39%", rotate: "15deg" },
  { label: "A", color: "#3b82f6", x: "65%", y: "31%", rotate: "22deg" },
  { label: "W", color: "#1fbf75", x: "77%", y: "23%", rotate: "29deg" },
  { label: "S", color: "#f44336", x: "88%", y: "17%", rotate: "35deg" },
];

const dictionaryWords = ["Retar", "Vistar", "Lest", "Catrivia", "Hackney", "Altruyn"];
const snippetItems = ["Calendar", "Hours", "Support inbox", "FAQ", "Careers links", "Elevator pitch"];
const languageItems = [
  "English",
  "Spanish",
  "Turkish",
  "French",
  "German",
  "Italian",
  "Japanese",
  "Korean",
  "Portuguese",
  "Dutch",
  "Arabic",
  "Hindi",
];

const testimonials = [
  {
    quote:
      "Flow is that extra little part of your brain that helps you formulate full sentences when you might be stuck in thought and have a jittery response.",
    name: "Jeanette Fox",
    role: "Founder",
  },
  {
    quote:
      "Stuttering and it still works really well. I think it's really slick. I love it.",
    name: "Agnes Wells",
    role: "UX Director",
  },
  {
    quote:
      "It has become the fastest way for me to get an idea out before it disappears.",
    name: "Mira Chen",
    role: "Product Lead",
  },
];

const proofCards = [
  {
    title: "From typing to talking",
    body: "Voice is the shortcut from concept to execution.",
    person: "Bejal Hoffmann",
    role: "Co-founder of Limelight",
  },
  {
    title: "90% faster everywhere",
    body: "Flow fits into every corner of how I work.",
    person: "Steven Bartlett",
    role: "Host of Diary of a CEO",
  },
  {
    title: "20% faster GTM execution",
    body: "Flow gave our team a shared speed advantage.",
    person: "Maya Patel",
    role: "Growth Lead",
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FlowLogo() {
  return (
    <span className={styles.brandLockup} aria-label="Flow">
      <span className={styles.brandBars} aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span>Flow</span>
    </span>
  );
}

function HocamBrand() {
  return (
    <span className={styles.brandLockup} aria-label="Hocam">
      <span className={styles.brandBars} aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span>Hocam</span>
    </span>
  );
}

function WisprButton({
  children,
  variant = "primary",
  icon,
  href = "#flow-reference-demo",
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "dark";
  icon?: ReactNode;
  href?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "ghost" && styles.buttonGhost,
        variant === "dark" && styles.buttonDark
      )}
    >
      {icon}
      <span>{children}</span>
    </a>
  );
}

function PlatformPills({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={styles.platformPills} aria-label="Supported platforms">
      {platformPills.map((platform) => (
        <span
          className={cn(styles.platformPill, inverse && styles.platformPillInverse)}
          key={platform}
        >
          {platform === "Mac" ? <Monitor size={13} /> : null}
          {platform === "Windows" ? <PanelsTopLeft size={13} /> : null}
          {platform === "iPhone" ? <Smartphone size={13} /> : null}
          {platform === "Android" ? <Globe2 size={13} /> : null}
          {platform}
        </span>
      ))}
    </div>
  );
}

function FloatingNav() {
  return (
    <header className={styles.floatingHeader}>
      <nav className={styles.nav} aria-label="Hocam navigation">
        <a href="#flow-reference-hero" className={styles.logoLink}>
          <HocamBrand />
        </a>
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>
        <div className={styles.navActions}>
          <WisprButton href="/login" variant="ghost" icon={<LogIn size={14} />}>
            Giriş Yap
          </WisprButton>
          <WisprButton href="/register" icon={<UserPlus size={14} />}>
            Kayıt Ol
          </WisprButton>
        </div>
        <button className={styles.menuButton} aria-label="Open navigation">
          <Menu size={18} />
        </button>
      </nav>
    </header>
  );
}

// Scroll-driven camera-zoom hero. A static study-room photo scales up around
// the laptop screen while the Hocam tutors mockup sits inside that screen from
// the first frame; near handoff a full-viewport copy of the mockup crossfades
// in, then its content scrolls like a page. Pure transforms/opacity/light blur
// — no video element, no seeks, no per-scroll React state.
//
// Phases: 0–0.45 slow approach (UI small, subtle, slightly blurred inside the
// laptop) · 0.45–0.72 push through the screen (bezel exits the viewport)
// · ~0.70–0.74 white-glass beat · 0.74–0.86 full page materializes
// · 0.84–0.92 inner page scroll · 0.92–1 the page shrinks into a product
// panel on the right while the marketing copy column appears on the left
// · ≥0.995 one-shot completion latch freezes that split composition for the
// rest of the mount.
//
// The in-slot mockup renders at a fixed internal size (1200×750, set in the
// .slotContent CSS) and is scaled to the slot; the slot's on-screen width is
// the only measured value (ResizeObserver). SLOT_TILT_DEG leans the top of the
// in-slot page away from the camera to follow the poster screen's perspective
// (its CSS twin is the perspective set on .screenSlot).
const SLOT_UI_WIDTH = 1200;
const SLOT_TILT_DEG = 2;
const HERO_COMPLETE_AT = 0.995;

const heroCopyPoints = [
  "Sınava ve derse göre filtrele",
  "Hoca profillerini karşılaştır",
  "Uygun saatleri kolayca gör",
];

function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const slotContentRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const preCollapseHeightRef = useRef(0);
  // One-shot latch: once the sequence has been seen to the end, the hero stays
  // in the completed product-page state until the page remounts.
  const [completed, setCompleted] = useState(false);
  // useReducedMotion() is null on the server but resolves on the first client
  // render — branching on it directly would make SSR and hydration markup
  // disagree, and React keeps the stale server attributes. Adopt it in state
  // after hydration instead.
  const prefersReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setReduceMotion(Boolean(prefersReducedMotion));
  }, [prefersReducedMotion]);

  const frozen = reduceMotion || completed;

  // Breakpoint for the final split composition (side-by-side vs stacked).
  // State updates only when the 720px boundary is crossed — never per scroll.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setIsNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  // Camera: scale the scene around the laptop-screen center (transform-origin
  // in CSS). End scale 4.8 pushes the screen past the viewport edges on both
  // axes for all sane aspect ratios.
  const sceneScale = useTransform(scrollYProgress, [0, 0.45, 0.75, 0.92], [1, 1.6, 4.8, 5.5]);
  const sceneTransform = useMotionTemplate`translate3d(-50%, -50%, 0) scale(${sceneScale})`;
  // Fades live in filter strings (opacity() function) rather than the CSS
  // opacity property: plain motion-value opacity in `style` fails to update on
  // scroll with framer-motion 12.42, while filter/transform bindings flush
  // reliably. Visually identical for these flat layers.
  const sceneOpacity = useTransform(scrollYProgress, [0.82, 0.9], [1, 0]);
  const sceneFilter = useMotionTemplate`opacity(${sceneOpacity})`;

  // Handoff is sequential, not a crossfade: the in-slot copy dissolves into
  // the screen's white glow just before the zoomed screen fills the viewport
  // (~0.72), leaving a beat of pure white "glass", and the full-viewport copy
  // materializes out of that white. Two overlapping copies at different
  // scales read as ghosting; through-white never does.

  // In-slot mockup: visible from the very first frame — distant, subtle,
  // lightly blurred — sharpening as the camera approaches.
  const slotBlur = useTransform(scrollYProgress, [0, 0.45, 0.66], [2.5, 1.5, 0]);
  const slotOpacity = useTransform(scrollYProgress, [0, 0.45, 0.62, 0.7], [0.95, 1, 1, 0]);
  const slotFilter = useMotionTemplate`blur(${slotBlur}px) opacity(${slotOpacity})`;

  // Full-viewport mockup: fades in from the white screen, settles, then owns
  // the page-scroll phase.
  const fullOpacity = useTransform(scrollYProgress, [0.74, 0.85], [0, 1]);
  const fullBlur = useTransform(scrollYProgress, [0.74, 0.83], [2, 0]);
  const fullFilter = useMotionTemplate`blur(${fullBlur}px) opacity(${fullOpacity})`;
  const fullScale = useTransform(scrollYProgress, [0.74, 0.88], [0.975, 1]);
  const contentY = useTransform(scrollYProgress, [0.84, 0.92], [0, -140]);

  // Final split: the page shrinks into a right-side product panel (bottom-
  // anchored card on narrow screens) while the copy column fades in on the
  // left (top block on narrow screens).
  const panelXEnd = isNarrow ? 0 : -2;
  const panelScaleEnd = isNarrow ? 0.66 : 0.68;
  const panelX = useTransform(scrollYProgress, [0.92, 1], [0, panelXEnd]);
  const panelScale = useTransform(scrollYProgress, [0.92, 1], [1, panelScaleEnd]);
  const panelTransform = useMotionTemplate`translate3d(${panelX}vw, 0, 0) scale(${panelScale})`;
  const panelFrozenTransform = isNarrow
    ? `scale(${panelScaleEnd})`
    : `translate3d(${panelXEnd}vw, 0, 0) scale(${panelScaleEnd})`;

  const copyOpacity = useTransform(scrollYProgress, [0.93, 1], [0, 1]);
  const copyBlur = useTransform(scrollYProgress, [0.93, 1], [8, 0]);
  const copyFilter = useMotionTemplate`blur(${copyBlur}px) opacity(${copyOpacity})`;
  const copyY = useTransform(scrollYProgress, [0.93, 1], [24, 0]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (completedRef.current || reduceMotion) return;
    if (progress < HERO_COMPLETE_AT) return;
    const hero = heroRef.current;
    if (!hero) return;
    // Transient degenerate measurements (style reflow, dev fast-refresh) can
    // collapse the hero for a frame, making useScroll's span ~0 and progress
    // spike to 1. Only latch when the scrub region really exists and the
    // actual scroll position agrees. Runs at most once per candidate frame.
    const scrubRange = hero.offsetHeight - window.innerHeight;
    if (scrubRange < window.innerHeight || window.scrollY < scrubRange * 0.9) return;
    completedRef.current = true;
    preCollapseHeightRef.current = hero.offsetHeight;
    setCompleted(true);
  });

  // Collapsing the 300vh scrub region on latch shifts everything below the
  // hero up; compensate the scroll position in the same frame so the user
  // stays on the exact frame they were looking at.
  useLayoutEffect(() => {
    if (!completed || !heroRef.current || preCollapseHeightRef.current === 0) return;
    const delta = heroRef.current.offsetHeight - preCollapseHeightRef.current;
    if (delta !== 0) window.scrollBy(0, delta);
  }, [completed]);

  // The slot's rendered width depends on viewport size only; measure it once
  // per resize, never per scroll. The scale is written imperatively to a plain
  // div: a bare MotionValue set from a ResizeObserver does not flush to the
  // DOM in framer-motion 12.42 (same dead-binding family as the opacity
  // workaround above), and this path is resize-time anyway.
  useEffect(() => {
    const slot = slotRef.current;
    const content = slotContentRef.current;
    if (!slot || !content) return;
    const update = () => {
      if (slot.clientWidth > 0) {
        content.style.transform = `scale(${slot.clientWidth / SLOT_UI_WIDTH}) rotateX(${SLOT_TILT_DEG}deg)`;
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [frozen]);

  return (
    <section
      ref={heroRef}
      className={cn(
        styles.hero,
        reduceMotion && styles.heroReduced,
        completed && styles.heroCompleted
      )}
      id="flow-reference-hero"
    >
      <div className={styles.heroSticky}>
        {!frozen && (
          <motion.div
            className={styles.sceneLayer}
            style={{ transform: sceneTransform, filter: sceneFilter }}
            aria-hidden
          >
            <Image
              className={styles.sceneImg}
              src="/landing/hocam-hero-monitor-entry-poster.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
            />
            <div ref={slotRef} className={styles.screenSlot}>
              <motion.div className={styles.slotFade} style={{ filter: slotFilter }}>
                <div ref={slotContentRef} className={styles.slotContent}>
                  <HeroTutorsMockup />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
        {/* Frozen states pass explicit static values (not undefined): framer
            keeps previously written inline styles for keys that simply
            disappear from the style prop. */}
        <motion.div
          className={styles.fullUiLayer}
          style={frozen ? { filter: "none", scale: 1 } : { filter: fullFilter, scale: fullScale }}
        >
          <motion.div
            className={cn(styles.heroCopy, frozen && styles.heroCopyActive)}
            style={frozen ? { filter: "none", y: 0 } : { filter: copyFilter, y: copyY }}
          >
            <h2 className={styles.heroCopyTitle}>YKS yolculuğunda doğru hocayı bul.</h2>
            <p className={styles.heroCopyText}>
              TYT, AYT ve okul dersleri için güvenilir hocaları karşılaştır, filtrele ve sana
              en uygun dersi planla.
            </p>
            <ul className={styles.heroCopyList}>
              {heroCopyPoints.map((point) => (
                <li key={point}>
                  <Check size={15} />
                  {point}
                </li>
              ))}
            </ul>
            <a className={cn(styles.button, styles.buttonPrimary)} href="/tutors">
              Hocaları Keşfet
            </a>
          </motion.div>
          <motion.div
            className={styles.productPanel}
            style={frozen ? { transform: panelFrozenTransform } : { transform: panelTransform }}
          >
            <div className={styles.productClip}>
              <HeroTutorsMockup
                scrollClassName={styles.productScrollPad}
                contentStyle={reduceMotion ? { y: 0 } : completed ? { y: -140 } : { y: contentY }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className={styles.phoneMockup} aria-label="Flow phone mockup">
      <div className={styles.phoneSpeaker} />
      <div className={styles.phoneCard}>
        <span className={styles.phoneLabel}>Flow</span>
        <p>Write faster in all your apps, on any device</p>
        <div className={styles.waveBars}>
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ height: `${12 + (index % 5) * 7}px` }} />
          ))}
        </div>
        <button>tap to speak</button>
      </div>
    </div>
  );
}

function DarkPlatformSection() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const phoneY = useTransform(scrollYProgress, [0.05, 0.28], [80, -72]);
  const iconsY = useTransform(scrollYProgress, [0.08, 0.35], [70, -46]);

  return (
    <section className={styles.darkDeviceSection} id="flow-reference-demo">
      <div className={styles.darkGrid}>
        <Reveal className={styles.darkCopy}>
          <PlatformPills inverse />
          <h2>
            Write faster in all your apps, on <em>any device</em>
          </h2>
          <p>
            Flow follows your cursor, catches your voice, and formats your thoughts without
            leaving the app you already use.
          </p>
          <WisprButton variant="dark" icon={<Play size={14} />}>
            Watch in action
          </WisprButton>
        </Reveal>
        <motion.div
          className={styles.deviceStage}
          style={{ y: reduceMotion ? 0 : phoneY }}
        >
          <PhoneMockup />
        </motion.div>
      </div>
      <motion.div
        className={styles.appArc}
        aria-hidden
        style={{ y: reduceMotion ? 0 : iconsY }}
      >
        {appIcons.map((icon) => (
          <span
            className={styles.appIcon}
            key={icon.label + icon.x}
            style={
              {
                "--icon-color": icon.color,
                "--icon-x": icon.x,
                "--icon-y": icon.y,
                "--icon-rotate": icon.rotate,
              } as CSSProperties
            }
          >
            {icon.label}
          </span>
        ))}
      </motion.div>
    </section>
  );
}

function LogoStrip() {
  const renderUniversityItems = (isDuplicate = false) =>
    universityLogos.map((university) => (
      <span className={styles.universityItem} key={`${university.name}-${isDuplicate ? "copy" : "main"}`}>
        <Image
          className={styles.universityLogo}
          src={university.logoSrc}
          alt={isDuplicate ? "" : university.alt}
          width={56}
          height={56}
        />
        <span>{university.name}</span>
      </span>
    ));

  return (
    <section className={styles.logoStrip}>
      <p>Türkiye&apos;nin önde gelen üniversitelerinden öğrencilerle uyumlu hocalar</p>
      <div className={styles.logoViewport}>
        <div className={styles.logoTrack}>
          <div className={styles.logoGroup}>{renderUniversityItems()}</div>
          <div className={styles.logoGroup} aria-hidden="true">
            {renderUniversityItems(true)}
          </div>
        </div>
      </div>
    </section>
  );
}

function ClaimSection() {
  return (
    <section className={styles.claimSection}>
      <Reveal className={styles.claimHeader}>
        <h2>
          4x <span>faster</span> than typing
        </h2>
        <p>
          Voice that finally works in forms, docs, code, messages, and anywhere else you write.
        </p>
        <div className={styles.ctaRow}>
          <WisprButton variant="ghost" icon={<Mic size={14} />}>
            Try Flow
          </WisprButton>
          <WisprButton icon={<Download size={14} />}>Download for macOS</WisprButton>
        </div>
      </Reveal>
      <div className={styles.speedGrid}>
        <Reveal className={styles.speedCard}>
          <Keyboard size={24} />
          <span>Keyboard</span>
          <strong>45 wpm</strong>
        </Reveal>
        <Reveal className={styles.mediaCard} delay={0.08}>
          <div className={styles.mediaBlur} />
          <div className={styles.curvedPrompt}>
            How would you like to speed up the file. Here are a few options.
          </div>
          <div className={styles.mediaBadge}>Flow</div>
          <strong>220 wpm</strong>
        </Reveal>
      </div>
    </section>
  );
}

function WorkSection() {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState(0);
  const activeJourney = tutorJourneyTabs[activeTab];

  return (
    <section className={styles.workSection}>
      <Reveal className={styles.workHeader}>
        <span className={styles.workEyebrow}>Hocam&apos;ın farkı</span>
        <h2>
          Sana uygun <em>hocayı</em> bulmanın daha akıllı yolu
        </h2>
        <p>
          YKS, TYT, AYT ve okul dersleri için hocaları filtrele, profilleri
          karşılaştır ve ders planını güvenle oluştur.
        </p>
        <div className={styles.workTabs}>
          {tutorDiscoveryPills.map((pill) => (
            <span key={pill}>{pill}</span>
          ))}
        </div>
      </Reveal>
      <Reveal className={styles.workPanel} delay={0.1}>
        <div className={styles.tutorMatchShell}>
          <div className={styles.journeyTabs} aria-label="Hocam öğrenci yolculuğu">
            {tutorJourneyTabs.map((tab, index) => (
              <button
                type="button"
                key={tab.title}
                className={cn(index === activeTab && styles.journeyTabActive)}
                aria-pressed={index === activeTab}
                onClick={() => setActiveTab(index)}
              >
                {tab.title}
              </button>
            ))}
          </div>
          <motion.div
            key={activeJourney.title}
            className={styles.journeyPanel}
            initial={reduceMotion ? false : { opacity: 0, y: -28, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div className={styles.journeyCopy}>
              <span>{activeJourney.eyebrow}</span>
              <h3>{activeJourney.heading}</h3>
              <p>{activeJourney.body}</p>
              <div className={styles.journeyChips}>
                {activeJourney.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
            <div className={styles.journeyPreview}>
              {activeJourney.stats.map((stat) => (
                <div className={styles.statCard} key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
              <div className={styles.tutorCardStack}>
                <article>
                  <strong>Elif K.</strong>
                  <span>Boğaziçi · Matematik</span>
                  <small>4.9 puan · 86 yorum</small>
                </article>
                <article>
                  <strong>Mert A.</strong>
                  <span>İTÜ · Fizik</span>
                  <small>4.8 puan · 64 yorum</small>
                </article>
              </div>
            </div>
          </motion.div>
          <div className={styles.differenceGrid}>
            {hocamDifferenceItems.map((item) => (
              <article key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function AutoEditsSection() {
  return (
    <section className={styles.autoSection}>
      <Reveal className={styles.autoHeader}>
        <h2>
          AI Auto <em>Edits</em>
        </h2>
        <p>
          Speak naturally and Flow researches your meaning, fixes rough wording, and
          turns scattered thoughts into finished text.
        </p>
        <div className={styles.ctaRow}>
          <WisprButton variant="ghost" icon={<Sparkles size={14} />}>
            Try Flow
          </WisprButton>
          <WisprButton icon={<Download size={14} />}>Download for macOS</WisprButton>
        </div>
      </Reveal>
      <Reveal className={styles.annotationStage}>
        <span className={styles.annotationOne}>Remove filler</span>
        <span className={styles.annotationTwo}>Added to Dictionary</span>
        <span className={styles.annotationThree}>Fixed spelling</span>
        <div className={styles.annotationCanvas}>
          <p>
            Let&apos;s reach out to Jenny from Legal. She may have mentioned the NDA
            isn&apos;t finalized yet, or possibly already sent it. Let&apos;s ask Claire.
          </p>
          <div className={styles.inputBar}>
            <span />
            <span />
            <span />
            <button aria-label="Send dictation">
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FeatureMockup({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <Reveal className={styles.featureBlock}>
      <div className={styles.featureText}>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <div className={styles.featureMock}>{children}</div>
    </Reveal>
  );
}

function DictionarySections() {
  return (
    <section className={styles.dictionarySection}>
      <FeatureMockup
        title="Personal dictionary"
        body="Flow automatically learns your unique words and adds them to your personal dictionary."
      >
        <div className={styles.mockHeader}>
          <strong>Your Dictionary</strong>
          <button aria-label="Add dictionary item">
            <Plus size={16} />
          </button>
        </div>
        <div className={styles.wordList}>
          {dictionaryWords.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>
      </FeatureMockup>
      <FeatureMockup
        title="Snippet library"
        body="Create shortcuts for the things your team says over and over."
      >
        <div className={styles.mockHeader}>
          <strong>Your Snippets</strong>
          <button aria-label="Add snippet">
            <Plus size={16} />
          </button>
        </div>
        <div className={styles.snippetList}>
          {snippetItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </FeatureMockup>
      <FeatureMockup
        title="100+ languages"
        body="Flow automatically detects and transcribes in your language."
      >
        <div className={styles.languagePanel}>
          {languageItems.map((language) => (
            <span key={language}>
              <Check size={13} />
              {language}
            </span>
          ))}
        </div>
      </FeatureMockup>
      <WisprButton variant="ghost" icon={<BookOpen size={14} />}>
        Explore all features
      </WisprButton>
    </section>
  );
}

function LavenderCta() {
  return (
    <section className={styles.lavenderCta}>
      <PlatformPills />
      <h2>Flow, wherever you work</h2>
      <p>
        Flow runs natively on Mac, Windows, iOS, and Android. Use it at your desk
        or deep work, and on your phone when you are on the move.
      </p>
      <WisprButton icon={<Download size={14} />}>Download for macOS</WisprButton>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className={styles.testimonials} id="testimonials">
      <Reveal>
        <h2>Flow love</h2>
      </Reveal>
      <div className={styles.quoteScroller}>
        {testimonials.map((testimonial) => (
          <article className={styles.quoteCard} key={testimonial.name}>
            <div className={styles.avatar}>{testimonial.name.charAt(0)}</div>
            <p>&quot;{testimonial.quote}&quot;</p>
            <strong>{testimonial.name}</strong>
            <span>{testimonial.role}</span>
          </article>
        ))}
      </div>
      <div className={styles.proofGrid}>
        {proofCards.map((card) => (
          <article className={styles.proofCard} key={card.title}>
            <ArrowUpRight size={18} />
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <span>{card.person}</span>
            <small>{card.role}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalBrandFooter() {
  return (
    <footer className={styles.footer}>
      <Reveal>
        <span className={styles.finalBrand}>Flow</span>
      </Reveal>
      <div className={styles.footerLinks}>
        <FlowLogo />
        <a href="#flow-reference-hero">Product</a>
        <a href="#flow-reference-demo">Demo</a>
        <a href="#flow-reference-demo">Privacy</a>
        <a href="#flow-reference-demo">Contact</a>
      </div>
    </footer>
  );
}

export function WisprReferencePage() {
  return (
    <div className={styles.page}>
      <FloatingNav />
      <HeroSection />
      <DarkPlatformSection />
      <LogoStrip />
      <ClaimSection />
      <WorkSection />
      <AutoEditsSection />
      <DictionarySections />
      <LavenderCta />
      <TestimonialsSection />
      <FinalBrandFooter />
    </div>
  );
}

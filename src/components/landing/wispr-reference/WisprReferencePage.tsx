"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Globe2,
  Keyboard,
  LogIn,
  Menu,
  Monitor,
  Plus,
  Smartphone,
  Sparkles,
  UserPlus,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { HeroTutorsMockup } from "./HeroTutorsMockup";
import { SquigglyWord } from "./SquigglyWord";
import styles from "./WisprReferencePage.module.css";

const navLinks = [
  { label: "Hocalar", href: "/tutors" },
  { label: "Nasıl Çalışır", href: "#flow-reference-demo" },
  { label: "Dersler", href: "/tutors" },
  { label: "Yorumlar", href: "#testimonials" },
  { label: "Destek", href: "/support" },
];
const platformPills = ["Web", "Mobil", "Online ders", "Yüz yüze"];
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
    title: "Doğrulanmış profilleri gör",
    body: "Üniversite, bölüm ve deneyim bilgileriyle güven veren hocaları daha kolay ayırt et.",
  },
  {
    title: "Kararını rahat ver",
    body: "Puan, yorum, deneyim ve saatlik ücretleri karşılaştırarak daha bilinçli seçim yap.",
  },
  {
    title: "Planını kolay kur",
    body: "Uygun zamanı seç, ders ritmini oluştur ve hedeflerine düzenli ilerle.",
  },
  {
    title: "Sade bir akışta ilerle",
    body: "Filtrele, karşılaştır, dersini planla; aradığın desteğe yorulmadan ulaş.",
  },
];

const dictionaryWords = ["Limit", "Türev", "Paragraf", "Optik", "Elektrik", "Kimyasal Denge"];
const snippetItems = [
  "Haftalık plan",
  "Deneme takibi",
  "Net analizi",
  "Konu listesi",
  "Soru bankası",
  "Tekrar programı",
];
const languageItems = [
  "Matematik",
  "Geometri",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Türkçe",
  "Edebiyat",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "Din Kültürü",
  "İngilizce",
];

const testimonials = [
  {
    quote:
      "Hocamı seçmeden önce puanlarına ve yorumlarına baktım. İlk dersten itibaren ne çalışacağımı biliyordum; TYT matematik netim iki ayda ciddi şekilde arttı.",
    name: "Zeynep A.",
    role: "12. sınıf öğrencisi",
  },
  {
    quote:
      "Mezun olarak tekrar hazırlanıyordum ve zamanım kısıtlıydı. Filtreleyip birkaç profili karşılaştırdım, kendi programıma uyan hocayı aynı gün buldum.",
    name: "Emre K.",
    role: "Mezun, YKS tekrar",
  },
  {
    quote:
      "Veli olarak en çok güven arıyordum. Hocanın üniversitesini, deneyimini ve diğer öğrencilerin yorumlarını görebilmek kararımızı çok kolaylaştırdı.",
    name: "Selin D.",
    role: "Veli",
  },
];

const proofCards = [
  {
    title: "Hedefinden hocana giden kısa yol",
    body: "Doğru filtrelerle dakikalar içinde sana uygun hoca listesine ulaş.",
    person: "Deniz Y.",
    role: "11. sınıf öğrencisi",
  },
  {
    title: "Karşılaştır, sonra karar ver",
    body: "Puan, yorum, ücret ve deneyimi yan yana görüp bilinçli seçim yap.",
    person: "Baran T.",
    role: "Mezun, YKS tekrar",
  },
  {
    title: "Planını güvenle kur",
    body: "Uygun saati seç, dersini planla, haftalık ritmini oturt.",
    person: "Elif K.",
    role: "Matematik hocası",
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
    <div className={styles.platformPills} aria-label="Kullanım kanalları">
      {platformPills.map((platform) => (
        <span
          className={cn(styles.platformPill, inverse && styles.platformPillInverse)}
          key={platform}
        >
          {platform === "Web" ? <Monitor size={13} /> : null}
          {platform === "Mobil" ? <Smartphone size={13} /> : null}
          {platform === "Online ders" ? <Globe2 size={13} /> : null}
          {platform === "Yüz yüze" ? <BookOpen size={13} /> : null}
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
        <button className={styles.menuButton} aria-label="Menüyü aç">
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
// Phases: 0–0.74 exponential dolly toward the laptop (UI visible inside the
// screen from the first frame, blurred-to-sharp; the screen fills the
// viewport ~0.73) · 0.74–0.82 geometry-locked crossfade — the full-page copy
// is transform-matched onto the in-screen copy, so the dissolve is invisible
// and the UI never disappears (no white beat) · 0.84–0.90 the locked
// transform settles to identity · 0.89–0.94 inner page scroll · 0.94–1 split
// into right product panel + left copy column · ≥0.995 one-shot latch.
//
// The in-slot mockup renders at a fixed internal size (1200×750) and is
// mapped onto the laptop screen with a true projective transform (matrix3d
// homography): its four corners land exactly on the screen's four corners as
// measured on the poster, so the page sits in the display like a Mercury-
// style device composite — no gaps, no pasted-rectangle look. As the camera
// pushes in, the quad eases to a flat cover rect ("the camera aligns with the
// screen"), which is exactly the geometry the locked crossfade math assumes.
//
// Everything is pure math from the viewport size and the aspect-locked
// scene-box formulas (CSS twins: .sceneLayer size/transform-origin,
// .screenSlot rect) — zero DOM measurement, zero per-scroll layout reads.
const SLOT_UI_WIDTH = 1200;
const SLOT_UI_HEIGHT = 750;
// The mockup's own .scroll top padding — needed to align the two instances'
// content tops during the locked crossfade.
const SLOT_UI_TOP_PAD = 46;
// Laptop-screen inner corners, measured on the 1920×1080 poster (px / 1920,
// px / 1080): TL (741,258) TR (1211,260) BR (1210,554) BL (740,546).
const SCREEN_QUAD = [
  { x: 741 / 1920, y: 258 / 1080 },
  { x: 1211 / 1920, y: 260 / 1080 },
  { x: 1210 / 1920, y: 554 / 1080 },
  { x: 740 / 1920, y: 546 / 1080 },
];
// Quad centroid — the camera zooms into this point (CSS twin: .sceneLayer
// transform-origin) and the .screenSlot rect is the quad's bounding box.
const SLOT_ORIGIN_X = (SCREEN_QUAD[0].x + SCREEN_QUAD[1].x + SCREEN_QUAD[2].x + SCREEN_QUAD[3].x) / 4;
const SLOT_ORIGIN_Y = (SCREEN_QUAD[0].y + SCREEN_QUAD[1].y + SCREEN_QUAD[2].y + SCREEN_QUAD[3].y) / 4;
// Perspective flattens out during the approach, finishing well before the
// crossfade so the locked handoff sees a plain flat rect.
const FLATTEN_START = 0.45;
const FLATTEN_END = 0.7;
// Dolly runs 0 → ZOOM_END; end scale overshoots the exact viewport-fill scale
// so the screen edges sit just past the viewport when the crossfade starts.
const ZOOM_END = 0.86;
const ZOOM_OVERSHOOT = 1.08;
const LOCK_BLEND_START = 0.84;
const LOCK_BLEND_END = 0.9;
const HERO_COMPLETE_AT = 0.995;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

type Point = { x: number; y: number };

// 4-point homography: maps the W×H board onto an arbitrary quad
// (TL, TR, BR, BL, in px of the target coordinate space) as a CSS matrix3d.
// Closed-form projective solve — a handful of flops, safe to run per frame.
function quadMatrix3d(w: number, h: number, [p0, p1, p2, p3]: Point[]) {
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + hh * p3.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + hh * p3.y;
  return `matrix3d(${a / w}, ${d / w}, 0, ${g / w}, ${b / h}, ${e / h}, 0, ${hh / h}, 0, 0, 1, 0, ${p0.x}, ${p0.y}, 0, 1)`;
}

// All geometry the hero needs, derived from the viewport alone. The board
// quad and flat rect are in .screenSlot-local px (the slot is the quad's
// bounding box); the rest feeds the dolly and the locked handoff.
function computeGeom(vw: number, vh: number) {
  const boxW = Math.max(vw, vh * (16 / 9));
  const boxH = Math.max(vh, vw * (9 / 16));
  const left = Math.min(SCREEN_QUAD[0].x, SCREEN_QUAD[3].x);
  const top = Math.min(SCREEN_QUAD[0].y, SCREEN_QUAD[1].y);
  const quad = SCREEN_QUAD.map((c) => ({
    x: (c.x - left) * boxW,
    y: (c.y - top) * boxH,
  }));
  const center = {
    x: (quad[0].x + quad[1].x + quad[2].x + quad[3].x) / 4,
    y: (quad[0].y + quad[1].y + quad[2].y + quad[3].y) / 4,
  };
  // Flat cover rect the quad settles into: quad's average height, board
  // aspect, centered on the quad centroid.
  const hFlat = (quad[3].y - quad[0].y + quad[2].y - quad[1].y) / 2;
  const wFlat = hFlat * (SLOT_UI_WIDTH / SLOT_UI_HEIGHT);
  const flat = [
    { x: center.x - wFlat / 2, y: center.y - hFlat / 2 },
    { x: center.x + wFlat / 2, y: center.y - hFlat / 2 },
    { x: center.x + wFlat / 2, y: center.y + hFlat / 2 },
    { x: center.x - wFlat / 2, y: center.y + hFlat / 2 },
  ];
  const pf =
    vw <= 720
      ? Math.min(Math.max(72, vh * 0.1), 112)
      : Math.min(Math.max(88, vh * 0.12), 132);
  return {
    quad,
    flat,
    kFlat: hFlat / SLOT_UI_HEIGHT,
    hFlat,
    sEnd: ZOOM_OVERSHOOT * Math.max(vw / wFlat, vh / hFlat),
    tx: vw / 2 + (SLOT_ORIGIN_X - 0.5) * boxW - vw / 2,
    cy: vh / 2 + (SLOT_ORIGIN_Y - 0.5) * boxH,
    vh,
    pf,
  };
}

const heroCopyPoints = [
  "Sınava ve derse göre filtrele",
  "Hoca profillerini karşılaştır",
  "Uygun saatleri kolayca gör",
];

function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
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

  // Spring-smoothed progress: every transform derives from this, which turns
  // discrete wheel steps into a continuous, slightly inertial dolly. Fully
  // reversible; near-settled by the time the latch threshold is crossed.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.0005,
    restSpeed: 0.001,
  });

  // Geometry derived once per mount/resize — pure math. React STATE, not a
  // ref: the motion transforms only re-evaluate when the scroll value changes,
  // so a silent ref update after mount would leave them rendering stale
  // geometry until the next scroll tick (and framer 12.42 drops externally
  // .set() motion values entirely). A state update re-renders and re-binds
  // them with fresh closures — same pattern as isNarrow above, and it fires
  // only on actual viewport changes, never per scroll.
  const [geom, setGeom] = useState(() => computeGeom(1280, 800));

  // Exponential dolly: constant perceived zoom rate (a linear scale ramp feels
  // like it decelerates), eased at both ends, held at sEnd past ZOOM_END.
  const zoomAt = (p: number) =>
    Math.exp(easeInOutSine(clamp01(p / ZOOM_END)) * Math.log(geom.sEnd));

  const sceneScale = useTransform(smooth, (p) => zoomAt(p));
  const sceneTransform = useMotionTemplate`translate3d(-50%, -50%, 0) scale(${sceneScale})`;
  // Fades live in filter strings (opacity() function) rather than the CSS
  // opacity property: plain motion-value opacity in `style` fails to update on
  // scroll with framer-motion 12.42, while filter/transform bindings flush
  // reliably. Visually identical for these flat layers.
  const sceneOpacity = useTransform(smooth, [0.86, 0.92], [1, 0]);
  const sceneFilter = useMotionTemplate`opacity(${sceneOpacity})`;

  // In-slot mockup: visible from the very first frame — distant, subtle,
  // lightly blurred — sharpening as the camera approaches. Blur only ever
  // animates on this small layer, never on the full-page layer.
  const slotBlur = useTransform(smooth, [0, 0.55], [2.2, 0]);
  const slotOpacity = useTransform(smooth, [0, 0.4, 0.74, 0.82], [0.94, 1, 1, 0]);
  const slotFilter = useMotionTemplate`blur(${slotBlur}px) opacity(${slotOpacity})`;

  // Projective board placement: corners glued to the measured screen quad at
  // the start, easing to the flat cover rect as the camera closes in.
  const slotMatrix = useTransform(smooth, (p) => {
    const g = geom;
    const m = smoothstep(FLATTEN_START, FLATTEN_END, p);
    const corners = g.quad.map((q, i) => ({
      x: q.x + (g.flat[i].x - q.x) * m,
      y: q.y + (g.flat[i].y - q.y) * m,
    }));
    return quadMatrix3d(SLOT_UI_WIDTH, SLOT_UI_HEIGHT, corners);
  });

  // Geometry-locked handoff: while the crossfade runs (0.74–0.82, after the
  // zoomed screen has filled the viewport), the full-page copy is transform-
  // matched onto the in-screen copy — same apparent content width (both render
  // a 920px column on wide viewports) and aligned content tops — so the
  // dissolve between the two is invisible and the UI never leaves the screen.
  // Afterwards the locked transform settles to identity, reading as the tail
  // of the same dolly.
  const lockAt = (p: number) => {
    const g = geom;
    const S = zoomAt(p);
    const sigmaLock = g.kFlat * S;
    // By the time the lock runs the board has flattened into the cover rect,
    // whose top edge sits hFlat/2 above the quad centroid.
    const slotContentTop = g.cy - (g.hFlat * S) / 2 + SLOT_UI_TOP_PAD * g.kFlat * S;
    const tyLock = slotContentTop - g.vh / 2 - (g.pf - g.vh / 2) * sigmaLock;
    const m = smoothstep(LOCK_BLEND_START, LOCK_BLEND_END, p);
    return {
      sigma: sigmaLock + (1 - sigmaLock) * m,
      tx: g.tx * (1 - m),
      ty: tyLock * (1 - m),
    };
  };
  // Narrow screens render a fluid column, so the pixel lock doesn't hold —
  // fall back to a plain overlapping fade with a gentle settle (still no
  // blank frame: the fades overlap).
  const fullSigma = useTransform(smooth, (p) =>
    isNarrow ? 0.97 + 0.03 * smoothstep(0.74, 0.86, p) : lockAt(p).sigma
  );
  const fullTx = useTransform(smooth, (p) => (isNarrow ? 0 : lockAt(p).tx));
  const fullTy = useTransform(smooth, (p) => (isNarrow ? 0 : lockAt(p).ty));
  const lockTransform = useMotionTemplate`translate3d(${fullTx}px, ${fullTy}px, 0) scale(${fullSigma})`;

  const fullOpacity = useTransform(smooth, [0.74, 0.82], [0, 1]);
  const fullFilter = useMotionTemplate`opacity(${fullOpacity})`;
  const contentY = useTransform(smooth, [0.89, 0.94], [0, -140]);

  // Final split: the page shrinks into a right-side product panel (bottom-
  // anchored card on narrow screens) while the copy column fades in on the
  // left (top block on narrow screens).
  const panelXEnd = isNarrow ? 0 : -2;
  const panelScaleEnd = isNarrow ? 0.66 : 0.68;
  const panelX = useTransform(smooth, [0.94, 1], [0, panelXEnd]);
  const panelScale = useTransform(smooth, [0.94, 1], [1, panelScaleEnd]);
  const panelTransform = useMotionTemplate`translate3d(${panelX}vw, 0, 0) scale(${panelScale})`;
  const panelFrozenTransform = isNarrow
    ? `scale(${panelScaleEnd})`
    : `translate3d(${panelXEnd}vw, 0, 0) scale(${panelScaleEnd})`;

  const copyOpacity = useTransform(smooth, [0.95, 1], [0, 1]);
  const copyBlur = useTransform(smooth, [0.95, 1], [8, 0]);
  const copyFilter = useMotionTemplate`blur(${copyBlur}px) opacity(${copyOpacity})`;
  const copyY = useTransform(smooth, [0.95, 1], [24, 0]);

  useMotionValueEvent(smooth, "change", (progress) => {
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

  // Geometry depends on the viewport alone (the scene box and slot rect are
  // pure functions of it), so a debounced resize listener is all that's
  // needed — no ResizeObserver, no DOM measurement, no per-scroll reads.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const apply = () => setGeom(computeGeom(window.innerWidth, window.innerHeight));
    const onResize = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(apply, 150);
    };
    apply();
    window.addEventListener("resize", onResize);
    return () => {
      if (timer !== null) clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
            <div className={styles.screenSlot}>
              <motion.div className={styles.slotFade} style={{ filter: slotFilter }}>
                <motion.div className={styles.slotContent} style={{ transform: slotMatrix }}>
                  <HeroTutorsMockup />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
        {/* Frozen states pass explicit static values (not undefined): framer
            keeps previously written inline styles for keys that simply
            disappear from the style prop. */}
        <motion.div
          className={styles.fullUiLayer}
          style={frozen ? { filter: "none" } : { filter: fullFilter }}
        >
          <motion.div
            className={styles.lockLayer}
            style={frozen ? { transform: "none" } : { transform: lockTransform }}
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
        </motion.div>
      </div>
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
          Hedefinden <span>hocana</span> giden kısa yol
        </h2>
        <p>
          Sınavına, dersine ve bütçene uygun hocayı dakikalar içinde bul; yorumları oku,
          karşılaştır, kararını ver.
        </p>
        <div className={styles.ctaRow}>
          <WisprButton variant="ghost" icon={<Sparkles size={14} />} href="/tutors">
            Hocaları Keşfet
          </WisprButton>
          <WisprButton icon={<UserPlus size={14} />} href="/register">
            Hoca Olarak Katıl
          </WisprButton>
        </div>
      </Reveal>
      <div className={styles.speedGrid}>
        <Reveal className={styles.speedCard}>
          <Keyboard size={24} />
          <span>Tek başına arama</span>
          <strong>Saatler sürer</strong>
        </Reveal>
        <Reveal className={styles.mediaCard} delay={0.08}>
          <div className={styles.mediaBlur} />
          <div className={styles.curvedPrompt}>
            Matematik · TYT · Online — sana uygun 24 hoca bulundu.
          </div>
          <div className={styles.mediaBadge}>Hocam</div>
          <strong>Dakikalar içinde</strong>
        </Reveal>
      </div>
    </section>
  );
}

function LowerHocamDarkSection() {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState(0);
  const activeJourney = tutorJourneyTabs[activeTab];

  return (
    <section className={styles.workSection} id="flow-reference-demo">
      <Reveal className={styles.workHeader}>
        <span className={styles.workEyebrow}>Hocam&apos;ın farkı</span>
        <h2>
          Sana uygun <SquigglyWord>hocayı</SquigglyWord> daha hızlı bul
        </h2>
        <p>
          YKS, TYT, AYT ve okul dersleri için hocaları filtrele, profilleri karşılaştır
          ve ders planını güvenle oluştur.
        </p>
        <div className={styles.workTabs}>
          {tutorDiscoveryPills.map((pill) => (
            <span key={pill}>{pill}</span>
          ))}
        </div>
      </Reveal>
      <div className={styles.workPanel}>
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
          <div className={styles.journeyPanelViewport}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeJourney.title}
                className={styles.journeyPanel}
                initial={reduceMotion ? false : { opacity: 0, y: -50, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 50, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
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
            </AnimatePresence>
          </div>
          <div className={styles.differenceHeader}>
            <span>Hocam&apos;ın farkı ne?</span>
            <p>
              Öğrencinin hedefini, seviyesini ve bütçesini dikkate alan sade bir akışla
              doğru hoca seçeneklerini görünür kılıyoruz.
            </p>
          </div>
          <div className={styles.differenceGrid}>
            {hocamDifferenceItems.map((item) => (
              <article key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AutoEditsSection() {
  return (
    <section className={styles.autoSection}>
      <Reveal className={styles.autoHeader}>
        <h2>
          Gerçek <em>öğrenci yorumları</em>
        </h2>
        <p>
          Her hoca profilinde geçmiş öğrencilerin puanları ve yorumları var; kararını
          gerçek deneyimlere göre ver.
        </p>
        <div className={styles.ctaRow}>
          <WisprButton variant="ghost" icon={<Sparkles size={14} />} href="/tutors">
            Hocaları Keşfet
          </WisprButton>
          <WisprButton icon={<UserPlus size={14} />} href="/register">
            Hoca Olarak Katıl
          </WisprButton>
        </div>
      </Reveal>
      <Reveal className={styles.annotationStage}>
        <span className={styles.annotationOne}>Doğrulanmış profil</span>
        <span className={styles.annotationTwo}>4.9 puan</span>
        <span className={styles.annotationThree}>86 yorum</span>
        <div className={styles.annotationCanvas}>
          <p>
            Elif Hoca ile 8 haftada TYT matematik netim 18&apos;den 31&apos;e çıktı.
            Konu anlatımı çok net, dersler planlı ilerliyor.
          </p>
          <div className={styles.inputBar}>
            <span />
            <span />
            <span />
            <button aria-label="Yorumu gönder">
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
        title="Konu bazlı eşleşme"
        body="Zorlandığın konuları seç; o alanda güçlü hocalar öne çıksın."
      >
        <div className={styles.mockHeader}>
          <strong>Konuların</strong>
          <button aria-label="Konu ekle">
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
        title="Çalışma düzenin hazır"
        body="Ders planı, deneme takibi ve tekrar programı tek yerde."
      >
        <div className={styles.mockHeader}>
          <strong>Çalışma Araçların</strong>
          <button aria-label="Araç ekle">
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
        title="Tüm YKS dersleri"
        body="TYT'den AYT'ye bütün derslerde uygun hoca bul."
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
      <WisprButton variant="ghost" icon={<BookOpen size={14} />} href="/tutors">
        Tüm Hocaları Gör
      </WisprButton>
    </section>
  );
}

function LavenderCta() {
  return (
    <section className={styles.lavenderCta}>
      <PlatformPills />
      <h2>Ders desteğin her yerde yanında</h2>
      <p>
        Hocam web&apos;de ve mobilde çalışır. İster evde ister yolda; hocanı bul,
        dersini planla, ilerlemeni takip et.
      </p>
      <WisprButton icon={<Sparkles size={14} />} href="/tutors">
        Hocaları Keşfet
      </WisprButton>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className={styles.testimonials} id="testimonials">
      <Reveal>
        <h2>Öğrenciler neden Hocam&apos;ı seçiyor?</h2>
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
        <span className={styles.finalBrand}>Hocam</span>
      </Reveal>
      <div className={styles.footerLinks}>
        <HocamBrand />
        <a href="/tutors">Hocalar</a>
        <a href="#flow-reference-demo">Nasıl Çalışır</a>
        <a href="/support">Gizlilik</a>
        <a href="/support">İletişim</a>
      </div>
    </footer>
  );
}

export function WisprReferencePage() {
  return (
    <div className={styles.page}>
      <FloatingNav />
      <HeroSection />
      <LogoStrip />
      <LowerHocamDarkSection />
      <ClaimSection />
      <AutoEditsSection />
      <DictionarySections />
      <LavenderCta />
      <TestimonialsSection />
      <FinalBrandFooter />
    </div>
  );
}

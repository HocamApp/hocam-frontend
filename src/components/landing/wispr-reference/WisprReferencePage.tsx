"use client";

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
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import styles from "./WisprReferencePage.module.css";

const navLinks = [
  { label: "Hocalar", href: "/tutors" },
  { label: "Nasıl Çalışır", href: "#flow-reference-demo" },
  { label: "Dersler", href: "/tutors" },
  { label: "Yorumlar", href: "#testimonials" },
  { label: "Destek", href: "/support" },
];
const platformPills = ["Mac", "Windows", "iPhone", "Android"];
const logoMarks = ["replit", "nuuly", "warp", "RIVIAN", "Notion", "Mercury"];
const workTabs = [
  "Teams",
  "Students",
  "Developers",
  "Creators",
  "Sales",
  "Customer Support",
  "Lawyers",
  "Leaders",
  "Accessibility",
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

function HeroSection() {
  return (
    <section className={styles.hero} id="flow-reference-hero">
      <div className={styles.heroVideoStage}>
        <Image
          src="/landing/hocam-hero-study-room.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
          aria-hidden
        />
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
  return (
    <section className={styles.logoStrip}>
      <div className={styles.character} aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p>Used by professionals everywhere to speak up their thoughts</p>
      <div className={styles.logoViewport}>
        <div className={styles.logoTrack}>
          {[...logoMarks, ...logoMarks].map((logo, index) => (
            <span key={`${logo}-${index}`}>{logo}</span>
          ))}
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
  return (
    <section className={styles.workSection}>
      <Reveal className={styles.workHeader}>
        <h2>
          Made for the way <em>you</em> work
        </h2>
        <p>Select one to see Flow in action.</p>
        <div className={styles.workTabs}>
          {workTabs.map((tab) => (
            <button key={tab}>{tab}</button>
          ))}
        </div>
      </Reveal>
      <Reveal className={styles.workPanel} delay={0.1}>
        <div className={styles.editorShell}>
          <div className={styles.editorTopbar}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.editorBody}>
            <div className={styles.editorText}>
              <span>Team update</span>
              <p>
                Tell Flow what changed. It rewrites the update with the right tone,
                structure, and context.
              </p>
            </div>
            <div className={styles.editorStack}>
              <span>Meeting notes</span>
              <span>Action items</span>
              <span>Customer follow-up</span>
            </div>
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

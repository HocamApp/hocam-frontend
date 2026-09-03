"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId } from "react";

import styles from "./about-section-1.module.css";

const HEADLINE = "Aynı sıralardan, senin yanına";

// Original photographs keep their framing and ratio inside smaller rounded frames.
const PORTRAITS = [
  {
    name: "Arda",
    src: "/images/about/founder-night.jpg",
    alt: "Hocam kurucularından birinin gece şehir manzarasında portresi",
    width: 810,
    height: 815,
  },
  {
    name: "Bahadır",
    src: "/images/about/founder-campus.jpg",
    alt: "Hocam kurucularından birinin üniversite kampüsünde portresi",
    width: 551,
    height: 496,
  },
  {
    name: "Emin",
    src: "/images/about/founder-city.jpg",
    alt: "Hocam kurucularından birinin şehir manzarasında portresi",
    width: 828,
    height: 1194,
  },
] as const;

function FounderPortrait({ index }: { index: number }) {
  const portrait = PORTRAITS[index];
  const [scope, animate] = useAnimate<HTMLElement>();
  const inView = useInView(scope, { once: true, amount: 0.15 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const figure = scope.current;
    if (reducedMotion !== false) {
      delete figure.dataset.captionPending;
      return;
    }
    // Keep server-rendered captions readable, then stage the client reveal.
    figure.dataset.captionPending = "true";
    if (!inView) return;

    let active = true;
    const animation = animate([
      [
        "[data-portrait-image]",
        { opacity: [0, 1], y: [index === 0 ? 40 : -40, 0], filter: ["blur(10px)", "blur(0px)"] },
        { duration: 0.7, delay: index * 0.15, ease: "easeOut" },
      ],
      ["figcaption", { opacity: [0, 1] }, { duration: 0.5, ease: "easeOut" }],
    ]);
    void animation.then(() => {
      if (active) delete figure.dataset.captionPending;
    });
    return () => {
      active = false;
      animation.stop();
      delete figure.dataset.captionPending;
    };
  }, [animate, inView, reducedMotion, index, scope]);

  return (
    <figure ref={scope} className={styles.portrait}>
      <div className={styles.frame} data-portrait-image>
        <Image
          src={portrait.src}
          alt={portrait.alt}
          width={portrait.width}
          height={portrait.height}
          unoptimized
          className={styles.photo}
        />
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.founderName}>{portrait.name}</span>
        <span>Co-founder</span>
      </figcaption>
    </figure>
  );
}

export default function AboutSection1() {
  const id = useId().replace(/:/g, "");
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const inView = useInView(scope, { once: true, amount: 0.1 });
  const reducedMotion = useReducedMotion();

  // Server HTML stays visible. Enhancement starts only when motion is allowed.
  useEffect(() => {
    if (!inView || reducedMotion !== false) return;
    const words = animate(
      "[data-about-word]",
      { y: ["100%", "0%"] },
      { type: "spring", stiffness: 250, damping: 30, delay: stagger(0.12, { from: "last" }) },
    );
    const description = animate(
      "[data-about-description]",
      { opacity: [0, 1], y: [24, 0], filter: ["blur(10px)", "blur(0px)"] },
      { duration: 0.7, ease: "easeOut" },
    );
    const action = animate("[data-about-action]", { opacity: [0, 1] }, { duration: 0.7, delay: 0.3 });
    return () => {
      words.stop();
      description.stop();
      action.stop();
    };
  }, [animate, inView, reducedMotion]);

  return (
    <section className={styles.hero} aria-labelledby={`${id}-heading`}>
      <div className={styles.container}>
        <div ref={scope} className={styles.introduction}>
          <p className={styles.eyebrow}>Hakkımızda</p>
          <h1 className={styles.heading} id={`${id}-heading`}>
            <span className="sr-only">{HEADLINE}</span>
            <span className={styles.words} aria-hidden="true">
              {HEADLINE.split(" ").map((word, index) => (
                <span className={styles.wordClip} key={index}>
                  <span data-about-word className={styles.word}>{word}</span>
                  {index < HEADLINE.split(" ").length - 1 ? " " : null}
                </span>
              ))}
            </span>
          </h1>
          <p className={styles.description} data-about-description>
            Üçümüz de YKS&apos;ye hazırlandık, aynı sıralardan geçtik. Kendimize uygun
            hocayı ararken yaşadığımız zorluklar bizi Hocam&apos;ı kurmaya götürdü.
            Şimdi senin, ihtiyacına uygun ve doğrulanmış bir hocaya ulaşman için
            çalışıyoruz.
          </p>
          <div data-about-action>
            <Link href="/tutors" className={styles.action}>
              Hocaları incele <ArrowRight size={20} weight="regular" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.portraits}>
          {PORTRAITS.map((portrait, index) => (
            <FounderPortrait key={portrait.src} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

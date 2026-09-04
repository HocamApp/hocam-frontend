"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId } from "react";

import styles from "./about-section-1.module.css";

const HEADLINE = "Aynı sıralardan, senin yanına";

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
      </div>
    </section>
  );
}

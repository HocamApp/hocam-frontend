"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId } from "react";

import styles from "./about-section-1.module.css";

const HEADLINE = "İyi bir hoca, şansa kalmasın";

// The first three silhouettes from the supplied component, in the same order.
const PORTRAITS = [
  {
    src: "/images/about/founder-night.jpg",
    alt: "Hocam kurucularından birinin gece şehir manzarasında portresi",
    position: "50% 48%",
    path: "M0.434125 0.00538712C0.56323 -0.00218488 0.714575 -0.000607013 0.814404 0.00302954L0.802642 0.163537C0.813884 0.167475 0.824927 0.172002 0.835358 0.177236C0.869331 0.194281 0.909224 0.225945 0.90824 0.27348C0.907177 0.324883 0.858912 0.354946 0.822651 0.36933C0.857426 0.376783 0.894591 0.387558 0.925837 0.404287C0.968002 0.426862 1.00569 0.464702 0.999287 0.515878C0.993163 0.564818 0.950731 0.597642 0.904098 0.615682C0.88204 0.624216 0.858239 0.62992 0.834803 0.633808C0.858076 0.639299 0.881603 0.646639 0.90267 0.656757C0.946271 0.677698 0.986875 0.715485 0.978905 0.768037C0.972241 0.811979 0.93615 0.843109 0.895204 0.862035C0.858032 0.879217 0.815169 0.887544 0.778534 0.892219C0.704792 0.901628 0.614366 0.901003 0.535183 0.899176C0.508115 0.898551 0.482286 0.89779 0.45773 0.897065C0.404798 0.895504 0.357781 0.894117 0.317008 0.894657C0.301552 0.894862 0.289265 0.895348 0.279749 0.895976C0.251913 0.937168 0.226467 0.980907 0.216015 1L0 0.941216C0.0140558 0.915539 0.051354 0.851547 0.0902557 0.797766C0.118421 0.758828 0.1722 0.745373 0.200402 0.740217C0.168437 0.733484 0.134299 0.723597 0.105102 0.708076C0.0614715 0.684884 0.0263696 0.64687 0.0325498 0.596965C0.0385804 0.548267 0.0803829 0.515256 0.12709 0.496909C0.146901 0.489127 0.168128 0.483643 0.189242 0.479724C0.163739 0.476035 0.137977 0.471053 0.115188 0.463936C0.0874831 0.455285 0.00855855 0.424854 0.016569 0.357817C0.0231721 0.302559 0.0838593 0.276249 0.116031 0.266164C0.149646 0.255625 0.188201 0.2505 0.221821 0.247468C0.208809 0.243824 0.195905 0.239492 0.183801 0.234287C0.152543 0.220846 0.101565 0.189547 0.105449 0.136312C0.108467 0.0949629 0.144168 0.0682612 0.171101 0.0543099C0.197578 0.0405945 0.227933 0.032236 0.25348 0.0267029C0.305656 0.0154021 0.370636 0.00911076 0.434125 0.00538712Z",
  },
  {
    src: "/images/about/founder-campus.jpg",
    alt: "Hocam kurucularından birinin üniversite kampüsünde portresi",
    position: "50% 45%",
    path: "M0.911218 0.329658C0.917139 0.29671 0.914994 0.262818 0.904967 0.23088C0.894939 0.198941 0.877327 0.169906 0.853635 0.146256C0.829944 0.122605 0.800878 0.105043 0.768923 0.0950708C0.736967 0.0850983 0.703072 0.083012 0.670134 0.0889901C0.651042 0.0615242 0.625587 0.0390856 0.595943 0.0235895C0.566299 0.00809344 0.533346 0 0.499896 0C0.466446 0 0.433493 0.00809344 0.403849 0.0235895C0.374204 0.0390856 0.34875 0.0615242 0.329658 0.0889901C0.29675 0.0830893 0.262904 0.0852337 0.231005 0.0952406C0.199106 0.105248 0.1701 0.12282 0.14646 0.14646C0.12282 0.1701 0.105248 0.199106 0.0952406 0.231005C0.0852337 0.262904 0.0830893 0.29675 0.0889901 0.329658C0.0615242 0.34875 0.0390856 0.374204 0.0235895 0.403849C0.00809344 0.433493 0 0.466446 0 0.499896C0 0.533346 0.00809344 0.566299 0.0235895 0.595943C0.0390856 0.625587 0.0615242 0.651042 0.0889901 0.670134C0.0830405 0.703077 0.0851562 0.73697 0.0951563 0.768917C0.105156 0.800864 0.122744 0.829915 0.146414 0.853586C0.170085 0.877256 0.199136 0.894844 0.231083 0.904844C0.26303 0.914844 0.296923 0.916959 0.329866 0.91101C0.348958 0.938476 0.374413 0.960914 0.404057 0.97641C0.433701 0.991907 0.466654 1 0.500104 1C0.533554 1 0.566507 0.991907 0.596151 0.97641C0.625796 0.960914 0.65125 0.938476 0.670343 0.91101C0.70327 0.916921 0.737139 0.914776 0.769057 0.904759C0.800976 0.894741 0.829997 0.877149 0.853642 0.853483C0.877287 0.829818 0.894854 0.800782 0.904844 0.768854C0.914834 0.736927 0.916949 0.703056 0.91101 0.670134C0.938476 0.651042 0.960914 0.625587 0.97641 0.595943C0.991907 0.566299 1 0.533346 1 0.499896C1 0.466446 0.991907 0.433493 0.97641 0.403849C0.960914 0.374204 0.938476 0.34875 0.91101 0.329658H0.911218Z",
  },
  {
    src: "/images/about/founder-city.jpg",
    alt: "Hocam kurucularından birinin şehir manzarasında portresi",
    position: "50% 48%",
    path: "M0.830625 0.5C0.883908 0.453139 0.926579 0.395449 0.955787 0.330781C0.984995 0.266114 1.00007 0.195958 1 0.125C1 0.0918481 0.98683 0.0600539 0.963388 0.0366119C0.939946 0.0131698 0.908152 2.32816e-07 0.875 2.32816e-07C0.725625 2.32816e-07 0.591667 0.0654169 0.5 0.169375C0.453139 0.116092 0.395449 0.0734212 0.330781 0.0442131C0.266114 0.0150049 0.195958 -6.83243e-05 0.125 2.32816e-07C0.0918481 2.32816e-07 0.0600539 0.0131698 0.0366119 0.0366119C0.0131698 0.0600539 2.32816e-07 0.0918481 2.32816e-07 0.125C2.32816e-07 0.274375 0.0654169 0.408333 0.169375 0.5C0.116092 0.546861 0.0734212 0.604551 0.0442131 0.669219C0.0150049 0.733887 -6.83243e-05 0.804042 2.32816e-07 0.875C2.32816e-07 0.908152 0.0131698 0.939946 0.0366119 0.963388C0.0600539 0.98683 0.0918481 1 0.125 1C0.274375 1 0.408333 0.934583 0.5 0.830625C0.546861 0.883908 0.604551 0.926579 0.669219 0.955787C0.733887 0.984995 0.804042 1.00007 0.875 1C0.908152 1 0.939946 0.98683 0.963388 0.963388C0.98683 0.939946 1 0.908152 1 0.875C1 0.725625 0.934583 0.591667 0.830625 0.5Z",
  },
] as const;

function FounderPortrait({ index, clipId }: { index: number; clipId: string }) {
  const portrait = PORTRAITS[index];
  const [scope, animate] = useAnimate<HTMLElement>();
  const inView = useInView(scope, { once: true, amount: 0.15 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView || reducedMotion !== false) return;
    const animation = animate(
      scope.current,
      { opacity: [0, 1], y: [index === 0 ? 40 : -40, 0], filter: ["blur(10px)", "blur(0px)"] },
      { duration: 0.7, delay: index * 0.15, ease: "easeOut" },
    );
    return () => animation.stop();
  }, [animate, inView, reducedMotion, index, scope]);

  return (
    <figure ref={scope} className={styles.portrait}>
      <div className={styles.cutout} style={{ clipPath: `url(#${clipId})` }}>
        <Image
          src={portrait.src}
          alt={portrait.alt}
          fill
          sizes="(max-width: 767px) min(320px, 100vw - 48px), (max-width: 1247px) calc((100vw - 96px) / 3), 384px"
          style={{ objectFit: "cover", objectPosition: portrait.position }}
        />
      </div>
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
      <svg className={styles.definitions} aria-hidden="true" focusable="false">
        <defs>
          {PORTRAITS.map((portrait, index) => (
            <clipPath key={portrait.src} id={`${id}-portrait-${index}`} clipPathUnits="objectBoundingBox">
              <path d={portrait.path} />
            </clipPath>
          ))}
        </defs>
      </svg>
      <div className={styles.container}>
        <div ref={scope} className={styles.introduction}>
          <p className={styles.eyebrow}>Hakkımızda</p>
          <h1 className={styles.heading} id={`${id}-heading`}>
            <span className="sr-only">{HEADLINE}</span>
            <span className={styles.words} aria-hidden="true">
              {HEADLINE.split(" ").map((word, index) => (
                <span className={styles.wordClip} key={index}>
                  <span data-about-word className={styles.word}>{word}</span>
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
            <FounderPortrait key={portrait.src} index={index} clipId={`${id}-portrait-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

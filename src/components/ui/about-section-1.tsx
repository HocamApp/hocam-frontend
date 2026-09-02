"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { stagger, useAnimate, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId } from "react";

import styles from "./about-section-1.module.css";

const HEADLINE = "Aynı sıralardan, senin yanına";

// Reference silhouettes; each photograph keeps its original framing and ratio.
const PORTRAITS = [
  {
    src: "/images/about/founder-night.jpg",
    alt: "Hocam kurucularından birinin gece şehir manzarasında portresi",
    width: 810,
    height: 815,
    path: "M0.5 0L0.550709 0.0460541C0.541963 0.0640581 0.528578 0.0791151 0.513027 0.0917341C0.520456 0.0907291 0.527892 0.0897201 0.535322 0.0887131C0.611493 0.0783851 0.687008 0.0681471 0.74727 0.0620541C0.784018 0.0583381 0.81958 0.0556691 0.848085 0.0560471C0.861663 0.0562271 0.879579 0.0571111 0.897003 0.0610981C0.909779 0.0640211 0.953305 0.0757431 0.966627 0.113912C0.981722 0.157163 0.941632 0.185488 0.934622 0.19038C0.921226 0.199729 0.905329 0.206897 0.892499 0.212115C0.870649 0.221001 0.842659 0.230142 0.811999 0.239254C0.83681 0.236656 0.861008 0.235257 0.882435 0.23621C0.898377 0.236918 0.921559 0.239201 0.943733 0.24826C0.970081 0.259024 0.995291 0.280051 0.999439 0.311122C1.00342 0.340933 0.985349 0.363373 0.972847 0.375304C0.959707 0.387843 0.943414 0.397844 0.928912 0.405582C0.908422 0.416516 0.883341 0.427176 0.856112 0.437447C0.864364 0.436866 0.872329 0.436539 0.879902 0.436521C0.894726 0.436485 0.918867 0.437439 0.942277 0.446087C0.955191 0.450858 0.970509 0.458949 0.982453 0.472319C0.994857 0.486205 0.999891 0.501633 0.999891 0.515923C0.999891 0.545114 0.979611 0.565612 0.967435 0.575746C0.953994 0.586934 0.937862 0.595927 0.923325 0.603007C0.898842 0.614932 0.868113 0.626538 0.834975 0.637664C0.839838 0.637396 0.844565 0.637223 0.849131 0.637157C0.862911 0.636959 0.885294 0.637431 0.907315 0.644301C0.91929 0.648037 0.935423 0.654982 0.948734 0.667909C0.96307 0.681831 0.969583 0.69831 0.969583 0.714241C0.969583 0.756168 0.930027 0.781711 0.913544 0.791403C0.891777 0.804203 0.864569 0.815187 0.838085 0.824629C0.790903 0.84145 0.729751 0.858922 0.669115 0.876246C0.66103 0.878556 0.652955 0.880864 0.644923 0.883166C0.574356 0.903398 0.504814 0.923898 0.447288 0.945539C0.385857 0.968649 0.354123 0.98743 0.343618 0.999097L0.202975 0.923461C0.215492 0.909559 0.231313 0.896865 0.249116 0.885256C0.245423 0.885811 0.241771 0.886347 0.238165 0.886862C0.198801 0.892483 0.158749 0.89657 0.125136 0.895416C0.10872 0.894852 0.0869431 0.892883 0.0658381 0.885656C0.0427861 0.877762 0.014566 0.861068 0.00449603 0.831173C-0.00578897 0.800641 0.00946505 0.775473 0.0227 0.761104C0.035552 0.747151 0.0521941 0.73661 0.0660451 0.729015C0.0763781 0.723348 0.0879781 0.717821 0.10046 0.712441C0.0918191 0.7114 0.0828791 0.709795 0.0740171 0.70737C0.0519021 0.701317 0.021352 0.687312 0.00720103 0.65819C-0.00776397 0.627392 0.00549305 0.600161 0.018904 0.584108C0.03142 0.569125 0.048329 0.557944 0.061925 0.550133C0.0899171 0.534051 0.127869 0.51891 0.167323 0.504992C0.189196 0.497276 0.213195 0.489371 0.238664 0.48135C0.201179 0.486283 0.163943 0.489581 0.131973 0.488597C0.114641 0.488064 0.0935231 0.486164 0.0730311 0.480032C0.0519071 0.47371 0.024429 0.460566 0.00936805 0.434874C-0.00727695 0.406482 0.000740049 0.379077 0.014172 0.360311C0.026036 0.343734 0.043174 0.331657 0.0566 0.32353C0.084167 0.306842 0.121704 0.291789 0.159992 0.278421C0.179936 0.271457 0.2017 0.264408 0.224764 0.257328C0.191619 0.258997 0.158935 0.259269 0.131101 0.256364C0.115367 0.254721 0.0954681 0.251528 0.0765251 0.244134C0.0569951 0.236512 0.030269 0.220901 0.019911 0.192566C0.00630305 0.155339 0.028173 0.125216 0.050968 0.10819C0.070358 0.0937081 0.094464 0.0847721 0.112073 0.0791001C0.142823 0.0691931 0.183388 0.0604071 0.219871 0.0525041C0.226304 0.0511111 0.232611 0.0497451 0.238714 0.0484051C0.283575 0.0385571 0.323527 0.0289901 0.35429 0.0175781L0.5 0Z",
  },
  {
    src: "/images/about/founder-campus.jpg",
    alt: "Hocam kurucularından birinin üniversite kampüsünde portresi",
    width: 551,
    height: 496,
    path: "M0.911218 0.329658C0.917139 0.29671 0.914994 0.262818 0.904967 0.23088C0.894939 0.198941 0.877327 0.169906 0.853635 0.146256C0.829944 0.122605 0.800878 0.105043 0.768923 0.0950708C0.736967 0.0850983 0.703072 0.083012 0.670134 0.0889901C0.651042 0.0615242 0.625587 0.0390856 0.595943 0.0235895C0.566299 0.00809344 0.533346 0 0.499896 0C0.466446 0 0.433493 0.00809344 0.403849 0.0235895C0.374204 0.0390856 0.34875 0.0615242 0.329658 0.0889901C0.29675 0.0830893 0.262904 0.0852337 0.231005 0.0952406C0.199106 0.105248 0.1701 0.12282 0.14646 0.14646C0.12282 0.1701 0.105248 0.199106 0.0952406 0.231005C0.0852337 0.262904 0.0830893 0.29675 0.0889901 0.329658C0.0615242 0.34875 0.0390856 0.374204 0.0235895 0.403849C0.00809344 0.433493 0 0.466446 0 0.499896C0 0.533346 0.00809344 0.566299 0.0235895 0.595943C0.0390856 0.625587 0.0615242 0.651042 0.0889901 0.670134C0.0830405 0.703077 0.0851562 0.73697 0.0951563 0.768917C0.105156 0.800864 0.122744 0.829915 0.146414 0.853586C0.170085 0.877256 0.199136 0.894844 0.231083 0.904844C0.26303 0.914844 0.296923 0.916959 0.329866 0.91101C0.348958 0.938476 0.374413 0.960914 0.404057 0.97641C0.433701 0.991907 0.466654 1 0.500104 1C0.533554 1 0.566507 0.991907 0.596151 0.97641C0.625796 0.960914 0.65125 0.938476 0.670343 0.91101C0.70327 0.916921 0.737139 0.914776 0.769057 0.904759C0.800976 0.894741 0.829997 0.877149 0.853642 0.853483C0.877287 0.829818 0.894854 0.800782 0.904844 0.768854C0.914834 0.736927 0.916949 0.703056 0.91101 0.670134C0.938476 0.651042 0.960914 0.625587 0.97641 0.595943C0.991907 0.566299 1 0.533346 1 0.499896C1 0.466446 0.991907 0.433493 0.97641 0.403849C0.960914 0.374204 0.938476 0.34875 0.91101 0.329658H0.911218Z",
  },
  {
    src: "/images/about/founder-city.jpg",
    alt: "Hocam kurucularından birinin şehir manzarasında portresi",
    width: 828,
    height: 1194,
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
          width={portrait.width}
          height={portrait.height}
          unoptimized
          className={styles.photo}
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
            <FounderPortrait key={portrait.src} index={index} clipId={`${id}-portrait-${index}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

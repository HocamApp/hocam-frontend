"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const VIDEO_SOURCE = "/images/brand/hocam-login-animation.mp4";
const FINAL_FRAME_SOURCE = "/images/brand/hocam-login-final.png";

// The goats reach their reference-matched stack at frame 274 (9.13 seconds).
// A short pause lets the landing read before the wordmark enters.
const WORD_REVEAL_TIME_SECONDS = 9.45;

export function LoginBrandAnimation() {
  const reduceMotion = useReducedMotion();
  const [showWordmark, setShowWordmark] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setShowWordmark(true);
      return;
    }

    const wordmarkTimer = window.setTimeout(() => {
      setShowWordmark(true);
    }, WORD_REVEAL_TIME_SECONDS * 1000);

    return () => window.clearTimeout(wordmarkTimer);
  }, [reduceMotion]);

  const showFinalArtwork = reduceMotion || videoFailed;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#f7f5f0] px-6 lg:px-10">
      <motion.div
        layout
        className="flex max-w-full items-center justify-center gap-[clamp(1rem,2vw,2.5rem)]"
        transition={{ layout: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
      >
        <motion.div
          layout
          className="relative aspect-[4/5] w-[clamp(11rem,17vw,19rem)] shrink-0 overflow-hidden"
          transition={{ layout: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
        >
          {showFinalArtwork ? (
            <Image
              src={FINAL_FRAME_SOURCE}
              alt=""
              aria-hidden
              fill
              priority
              sizes="(min-width: 768px) 19rem, 0px"
              className="object-cover"
            />
          ) : (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              onTimeUpdate={(event) => {
                if (event.currentTarget.currentTime >= WORD_REVEAL_TIME_SECONDS) {
                  setShowWordmark(true);
                }
              }}
              onEnded={() => setShowWordmark(true)}
              onError={() => {
                setVideoFailed(true);
                setShowWordmark(true);
              }}
            >
              <source src={VIDEO_SOURCE} type="video/mp4" />
            </video>
          )}
        </motion.div>

        <AnimatePresence initial={false}>
          {showWordmark && (
            <motion.p
              key="hocam-wordmark"
              translate="no"
              initial={{ opacity: 0, x: -28, scale: 0.96, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="notranslate whitespace-nowrap text-[clamp(3.25rem,5.5vw,6.5rem)] font-semibold leading-none tracking-[-0.055em] text-black"
            >
              Hocam
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

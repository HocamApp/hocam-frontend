"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const VIDEO_SOURCE = "/images/brand/hocam-login-animation.mp4";
const FINAL_FRAME_SOURCE = "/images/brand/hocam-login-final.png";

// The two halves of the mark lock together at frame 90 (3.00 s) and the lockup is held until
// 4.00 s. Revealing the wordmark a quarter second into that hold lets the lock land first.
const WORD_REVEAL_TIME_SECONDS = 3.25;

export function LoginBrandAnimation() {
  const reduceMotion = useReducedMotion();
  const [showWordmark, setShowWordmark] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // useReducedMotion() always reports false on the server, so branching on it directly made the
  // server send <video> while a reduced-motion client rendered <img> — a hydration mismatch that
  // made React discard the server HTML and re-render the whole root. Gating the swap on mount
  // keeps the server and first client render identical, then swaps once the preference is known.
  const showFinalArtwork = (mounted && reduceMotion) || videoFailed;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-hidden px-[clamp(0.75rem,2vw,2rem)] py-[clamp(1rem,3vh,2.5rem)]">
      {/*
        The clip is letterboxed with object-contain rather than cropped, and its own background
        is the exact cream of the surrounding card, so the letterbox is invisible and the video
        simply takes the largest size that fits whatever shape the panel happens to be. That is
        what keeps this from breaking at any breakpoint: a narrow panel makes the video smaller,
        never cropped or distorted.
      */}
      <div className="relative mx-auto min-h-0 w-full max-w-[46rem] flex-1">
        {showFinalArtwork ? (
          <Image
            src={FINAL_FRAME_SOURCE}
            alt=""
            aria-hidden
            fill
            priority
            sizes="(min-width: 1024px) 46rem, (min-width: 768px) 40vw, 0px"
            className="object-contain"
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onTimeUpdate={(event) => {
              if (event.currentTarget.currentTime >= WORD_REVEAL_TIME_SECONDS) {
                setShowWordmark(true);
              }
            }}
            onError={() => {
              setVideoFailed(true);
              setShowWordmark(true);
            }}
          >
            <source src={VIDEO_SOURCE} type="video/mp4" />
          </video>
        )}
      </div>

      {/*
        The wordmark's row is always laid out, whether or not the word has entered yet, and only
        opacity/transform animate. Reserving the space is what stops the reveal from resizing the
        video mid-playback — the layout shift this screen was previously flagged for.
      */}
      <div className="flex h-[clamp(3rem,7vh,5.5rem)] shrink-0 items-center justify-center">
        <motion.p
          translate="no"
          initial={false}
          animate={
            showWordmark
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 14, filter: "blur(10px)" }
          }
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="notranslate whitespace-nowrap text-[clamp(2.5rem,4.5vw,5rem)] font-semibold leading-none tracking-[-0.055em] text-black"
        >
          Hocam
        </motion.p>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const VIDEO_SOURCE = "/images/brand/hocam-login-animation.mp4";
const FINAL_FRAME_SOURCE = "/images/brand/hocam-login-final.png";

export function LoginBrandAnimation() {
  const reduceMotion = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // useReducedMotion() always reports false on the server, so branching on it directly made the
  // server send <video> while a reduced-motion client rendered <img> — a hydration mismatch that
  // made React discard the server HTML and re-render the whole root. Gating the swap on mount
  // keeps the server and first client render identical, then swaps once the preference is known.
  const showFinalArtwork = (mounted && reduceMotion) || videoFailed;

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden px-[clamp(0.75rem,2vw,2rem)] py-[clamp(1rem,3vh,2.5rem)]">
      {/*
        The proof-point carousel is letterboxed with object-contain rather than cropped. Its
        background matches the surrounding card, so it can take the largest size that fits the
        panel without distortion. It returns to the complete Hocam lockup and intentionally does
        not loop, leaving that brand frame visible while the user signs in.
      */}
      <div className="relative mx-auto aspect-[4/3] max-h-full w-full max-w-[46rem]">
        {showFinalArtwork ? (
          <Image
            src={FINAL_FRAME_SOURCE}
            alt="Hocam"
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
            playsInline
            preload="auto"
            onError={() => {
              setVideoFailed(true);
            }}
            aria-label="The Hocam logo turns pages to reveal five education milestones"
          >
            <source src={VIDEO_SOURCE} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}

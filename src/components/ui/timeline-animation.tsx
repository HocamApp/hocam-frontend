"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

/**
 * Scroll-reveal wrapper (Nyxb UI / 21st.dev `timeline-animation`).
 *
 * Every child watches the SAME section ref rather than its own, so one
 * intersection starts the whole group and `animationNum` staggers it. That is
 * what keeps a grid revealing in reading order instead of each card firing as
 * it individually crosses the fold.
 *
 * Not related to `ui/timeline.tsx` despite both exporting a `TimelineContent` —
 * that one is the dot-and-line list item. Import by path, not by name alone.
 */

type TimelineTag = "div" | "article" | "section" | "span" | "li" | "p" | "h1" | "h2" | "h3";

const DEFAULT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -20, filter: "blur(10px)" },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: index * 0.15, duration: 0.5 },
  }),
};

interface TimelineContentProps {
  children?: React.ReactNode;
  /** Position in the stagger order — multiplied by the variant's delay. */
  animationNum: number;
  /** Ref of the shared section that triggers the group. */
  timelineRef: React.RefObject<HTMLElement>;
  customVariants?: Variants;
  className?: string;
  as?: TimelineTag;
  once?: boolean;
}

export function TimelineContent({
  children,
  animationNum,
  timelineRef,
  customVariants,
  className,
  as = "div",
  once = true,
}: TimelineContentProps) {
  const isInView = useInView(timelineRef, { once, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  // Reduced motion gets the finished state, not a faster animation: the reveal
  // carries no information the static layout does not already show.
  if (reduceMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as] as React.ElementType;

  return (
    <MotionTag
      custom={animationNum}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={customVariants ?? DEFAULT_VARIANTS}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

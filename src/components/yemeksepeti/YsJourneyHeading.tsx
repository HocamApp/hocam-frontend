"use client";

import {
  CalendarBlank,
  CursorClick,
  GraduationCap,
  VideoCamera,
} from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";

import { TextRotate } from "@/components/ui/text-rotate";

/**
 * "Sen sadece ___" — the journey section's heading, with the last word
 * rotating through the four things a student actually does.
 *
 * The four labels are the four steps of the section underneath it, in the
 * same order, so the heading is a summary rather than a slogan bolted on.
 *
 * Deviations from DESIGN.md, both deliberate and both narrow:
 *
 * - DESIGN.md permits only motion that communicates system state, and this
 *   communicates nothing. It is a marketing device on one heading, and it
 *   stops entirely under `prefers-reduced-motion`, where the first label
 *   simply stays put.
 * - The reference this comes from puts an emoji beside the rotating word.
 *   Emoji are banned outright (pattern 7), so the accent is a Phosphor icon
 *   instead, and each one names its own step: a cursor for choosing, a
 *   calendar for scheduling, a camera for the lesson, a cap for learning.
 *   That keeps the rule that an icon must carry meaning.
 *
 * The pill is `--pink` with white type, DESIGN.md's primary pairing, at
 * 4.05:1. At this size the text is well past the 24px large-text threshold,
 * where the floor is 3:1.
 */

const STEPS = [
  { label: "seç", Icon: CursorClick },
  { label: "gün belirle", Icon: CalendarBlank },
  { label: "derse gir", Icon: VideoCamera },
  { label: "öğren", Icon: GraduationCap },
] as const;

const LABELS = STEPS.map((step) => step.label);

// The demo's own spring. Fast enough that the box resize reads as the word
// pushing it rather than as an animation of its own.
const SPRING = { type: "spring" as const, damping: 30, stiffness: 400 };

export function YsJourneyHeading() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  const CurrentIcon = STEPS[index].Icon;

  return (
    <>
      {/* One stable sentence for assistive tech. Announcing a heading that
          rewrites itself every two seconds is worse than announcing all four
          things once. */}
      <span className="sr-only">
        Sen sadece seç, gün belirle, derse gir, öğren.
      </span>

      <span aria-hidden className="block">
        <LayoutGroup>
          <motion.span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2" layout>
            <motion.span layout transition={SPRING}>
              Sen sadece
            </motion.span>

            <motion.span
              layout
              transition={SPRING}
              className="inline-flex items-center gap-2 overflow-hidden rounded-card bg-pink px-4 py-1 text-white md:gap-3 md:px-5 md:py-2"
            >
              <TextRotate
                texts={[...LABELS]}
                auto={!reduceMotion}
                onNext={setIndex}
                staggerFrom="last"
                staggerDuration={0.025}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                transition={SPRING}
                rotationInterval={2600}
                // The heading runs at a 0.95 line height, which is tighter
                // than Poppins' own descender depth, so g, ğ and ç were
                // being cut by the mask that makes the letters slide in.
                // The rotating word gets its own 1.2 leading, and the mask
                // box a little bottom padding, so the descenders clear it.
                mainClassName="justify-center leading-[1.2]"
                splitLevelClassName="overflow-hidden pb-[0.12em]"
              />

              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={index}
                  initial={{ y: "60%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-60%", opacity: 0 }}
                  transition={SPRING}
                  className="inline-flex shrink-0"
                >
                  <CurrentIcon size={32} weight="regular" />
                </motion.span>
              </AnimatePresence>
            </motion.span>
          </motion.span>
        </LayoutGroup>
      </span>
    </>
  );
}

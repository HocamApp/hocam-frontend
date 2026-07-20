"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { MATCH_EASING, MATCH_MOTION } from "./motion";

export function SelectionCard({
  selected,
  label,
  detail,
  onClick,
}: {
  selected: boolean;
  label: string;
  detail?: string;
  onClick: () => void;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      whileHover={reducedMotion ? undefined : { y: -1 }}
      whileTap={reducedMotion ? undefined : { scale: 0.99, y: 0 }}
      animate={reducedMotion ? undefined : { scale: selected ? 1.01 : 1 }}
      transition={{ duration: MATCH_MOTION.select, ease: MATCH_EASING.interaction }}
      className={`group flex min-h-14 w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left outline-none transition-[border-color,background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-[#ff5968] focus-visible:ring-offset-2 ${
        selected
          ? "border-[#ff5968] bg-[#fff1f2] text-neutral-950 shadow-[0_8px_24px_rgba(255,89,104,0.09)]"
          : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
      }`}
    >
      <motion.span
        animate={{
          borderColor: selected ? "#ff5968" : "#d4d4d4",
          backgroundColor: selected ? "#ff5968" : "#ffffff",
        }}
        transition={{ duration: MATCH_MOTION.select, ease: MATCH_EASING.interaction }}
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-white"
      >
        <AnimatePresence initial={false}>
          {selected ? (
            <motion.span
              key="check"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.7 }}
              transition={{ duration: MATCH_MOTION.select, ease: MATCH_EASING.enter }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.span>
      <span>
        <span className="block text-sm font-semibold sm:text-base">{label}</span>
        {detail ? <span className="mt-0.5 block text-sm text-neutral-500">{detail}</span> : null}
      </span>
    </motion.button>
  );
}

export function SelectionCount({
  selected,
  maximum,
  noun,
}: {
  selected: number;
  maximum: number;
  noun: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <p className="mb-3 flex items-center justify-between gap-3 text-sm text-neutral-500">
      <span>En fazla {maximum} {noun} seçebilirsin.</span>
      <span
        className="inline-flex min-w-[4.5rem] items-center justify-end gap-1 font-semibold text-neutral-700"
        aria-live="polite"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={selected}
            className="notranslate tabular-nums"
            translate="no"
            initial={reducedMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: MATCH_MOTION.select, ease: MATCH_EASING.enter }}
          >
            {selected} / {maximum}
          </motion.span>
        </AnimatePresence>
        <span>seçildi</span>
      </span>
    </p>
  );
}

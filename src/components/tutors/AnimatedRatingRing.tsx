"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, formatRating } from "@/lib/utils";

export function AnimatedRatingRing({ value, size = 96, label, className }: { value: number; size?: number; label?: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(value / 5, 1));
  // Shrink on small screens (svg is viewBox-scaled, so only the box changes).
  // CSS vars keep it responsive without a client-only media query (no SSR mismatch).
  const mobileSize = Math.max(48, Math.round(size * 0.72));
  const sizeVars = { "--ring": `${size}px`, "--ring-sm": `${mobileSize}px` } as CSSProperties;
  return <div className={cn("relative inline-flex shrink-0 items-center justify-center h-[var(--ring-sm)] w-[var(--ring-sm)] sm:h-[var(--ring)] sm:w-[var(--ring)]", className)} style={sizeVars} role="img" aria-label={`${label ? `${label}: ` : ""}${formatRating(value)} / 5`}><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90"><circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" /><motion.circle cx="50" cy="50" r={radius} fill="none" className="stroke-amber-500" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: reduceMotion ? circumference * (1 - progress) : circumference }} whileInView={{ strokeDashoffset: circumference * (1 - progress) }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }} /></svg><span className="absolute text-center"><strong className="block text-base leading-none sm:text-lg">{formatRating(value)}</strong><span className="text-[10px] text-muted-foreground">/ 5</span></span></div>;
}

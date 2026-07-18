"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SubjectRating } from "@/types";
import { formatRating } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SubjectRatingBreakdown({ subjectRatings }: { subjectRatings: SubjectRating[] }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  if (subjectRatings.length === 0) return null;
  const visible = expanded ? subjectRatings : subjectRatings.slice(0, 3);
  return <section className="space-y-3"><h3 className="text-sm font-semibold">Derslere göre puan</h3><div className="space-y-2">{visible.map((rating) => <div key={rating.subject.id} className="rounded-2xl border bg-card p-3 sm:p-4"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{rating.subject.name}</p><p className="text-xs text-muted-foreground">{rating.count} değerlendirme</p></div><span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 sm:px-3 sm:text-sm">★ {formatRating(rating.average)}</span></div><div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted sm:mt-3"><motion.div className="h-full rounded-full bg-amber-500" initial={{ width: reduceMotion ? `${(rating.average / 5) * 100}%` : 0 }} whileInView={{ width: `${(rating.average / 5) * 100}%` }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: "easeOut" }} /></div></div>)}</div>{subjectRatings.length > 3 && <Button variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>{expanded ? <>Daha az göster<ChevronUp className="ml-2 h-4 w-4" /></> : <>Tüm ders puanlarını göster<ChevronDown className="ml-2 h-4 w-4" /></>}</Button>}</section>;
}

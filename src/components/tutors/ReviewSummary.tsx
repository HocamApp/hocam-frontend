"use client";

import type { TutorReviewSummary } from "@/types";
import { REVIEW_CRITERIA } from "@/lib/reviewCriteria";
import { AnimatedRatingRing } from "@/components/tutors/AnimatedRatingRing";

/*
 * No gradient, no lift, no shadow. The tiles used a `from-primary/5` wash and a
 * `-translate-y-0.5 hover:shadow-sm` lift, which are three separate banned
 * patterns stacked on one component. Hover moves the border to ink instead,
 * the same state every other surface here uses.
 */
export function ReviewSummary({ summary }: { summary: TutorReviewSummary }) {
  const hasCriteria = REVIEW_CRITERIA.some(({ key }) => (summary.criteria_ratings?.[key]?.count ?? 0) > 0);
  return <div className="space-y-6"><div className="flex flex-col items-center gap-5 rounded-card border border-line bg-surface p-5 text-center sm:flex-row sm:p-6 sm:text-left"><AnimatedRatingRing value={summary.overall_rating} size={104} label="Genel puan" /><div className="min-w-0"><h3 className="text-h3-m md:text-h3">Genel değerlendirme</h3><p className="mt-1 text-body text-ink-mid">{summary.review_count} öğrenci değerlendirmesi</p></div></div>{hasCriteria ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{REVIEW_CRITERIA.map(({ key, label, shortLabel, icon: Icon }) => { const criterion = summary.criteria_ratings[key]; return <div key={key} className="grid min-h-28 grid-cols-[64px_1fr] items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors duration-[--duration-state] hover:border-ink"><AnimatedRatingRing value={criterion.average} size={64} label={label} /><p className="flex min-w-0 items-center gap-1.5 text-sm font-medium leading-5"><Icon className="size-4 shrink-0 text-ink" />{shortLabel}</p></div>; })}</div> : <div className="rounded-card border border-line bg-paper p-6 text-body text-ink-mid">İlk değerlendirmeden sonra kriter puanları burada görünecek.</div>}</div>;
}

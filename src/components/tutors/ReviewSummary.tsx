"use client";

import type { TutorReviewSummary } from "@/types";
import { REVIEW_CRITERIA } from "@/lib/reviewCriteria";
import { AnimatedRatingRing } from "@/components/tutors/AnimatedRatingRing";

export function ReviewSummary({ summary }: { summary: TutorReviewSummary }) {
  const hasCriteria = REVIEW_CRITERIA.some(({ key }) => (summary.criteria_ratings?.[key]?.count ?? 0) > 0);
  return <div className="space-y-6"><div className="flex flex-col items-center gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 text-center sm:flex-row sm:text-left"><AnimatedRatingRing value={summary.overall_rating} size={120} label="Genel puan" /><div><h3 className="text-lg font-semibold">Genel değerlendirme</h3><p className="mt-1 text-sm text-muted-foreground">{summary.review_count} değerlendirme · tamamlanan derslerden gelen öğrenci görüşleri</p></div></div>{hasCriteria ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{REVIEW_CRITERIA.map(({ key, label, icon: Icon }) => { const criterion = summary.criteria_ratings[key]; return <div key={key} className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm"><AnimatedRatingRing value={criterion.average} size={72} label={label} /><div className="min-w-0"><p className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-3.5 w-3.5 text-primary" />{label}</p><p className="mt-1 text-xs text-muted-foreground">{criterion.count} değerlendirme</p></div></div>; })}</div> : <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">İlk değerlendirmeden sonra kriter puanları burada görünecek.</div>}</div>;
}

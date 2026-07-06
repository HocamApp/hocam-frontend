"use client";

import { TutorReviewSummary } from "@/types";
import { formatRating } from "@/lib/utils";
import { REVIEW_CRITERIA } from "@/lib/reviewCriteria";
import { RatingStars } from "@/components/tutors/RatingStars";

function reviewCountLabel(count: number): string {
  return `${count} değerlendirme`;
}

export function ReviewSummary({ summary }: { summary: TutorReviewSummary }) {
  const hasCriteria = REVIEW_CRITERIA.some(
    ({ key }) => (summary.criteria_ratings?.[key]?.count ?? 0) > 0
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-8">
      {/* Overall rating */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold">
            {formatRating(summary.overall_rating)}
          </span>
          <div>
            <RatingStars rating={summary.overall_rating} />
            <p className="text-sm text-muted-foreground">
              {reviewCountLabel(summary.review_count)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Tamamlanan derslerden gelen öğrenci değerlendirmeleri
        </p>
      </div>

      {/* Criteria cards */}
      {hasCriteria ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {REVIEW_CRITERIA.map(({ key, label, icon: Icon }) => {
            const criteria = summary.criteria_ratings[key];
            return (
              <div
                key={key}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl font-semibold leading-none">
                    {formatRating(criteria.average)}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/80">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{label}</p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${Math.min((criteria.average / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {reviewCountLabel(criteria.count)}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center rounded-lg border border-dashed bg-muted/30 p-6">
          <p className="text-sm text-muted-foreground">
            İlk değerlendirmeden sonra kriter puanları burada görünecek.
          </p>
        </div>
      )}
    </div>
  );
}

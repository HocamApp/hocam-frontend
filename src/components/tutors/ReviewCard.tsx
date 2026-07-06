"use client";

import { Review } from "@/types";
import { formatDate, formatRating, formatRelativeDate } from "@/lib/utils";
import { REVIEW_CRITERIA } from "@/lib/reviewCriteria";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/tutors/RatingStars";

export function ReviewCard({ review }: { review: Review }) {
  const hasCriteria = REVIEW_CRITERIA.every(
    ({ field }) => typeof review[field] === "number" && review[field] >= 1
  );

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RatingStars rating={review.rating} />
            <span className="text-sm font-medium">
              {formatRating(review.rating)}
            </span>
          </div>
          <span
            className="text-sm text-muted-foreground"
            title={formatDate(review.created_at)}
          >
            {formatRelativeDate(review.created_at)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">Öğrenci</p>
          {review.subject && (
            <Badge variant="secondary" className="text-xs font-normal">
              {review.subject.name} · {review.subject.exam_type}
            </Badge>
          )}
        </div>
        {review.comment && <p className="mt-1 text-sm">{review.comment}</p>}
        {hasCriteria && (
          <p className="mt-2 text-xs text-muted-foreground">
            {REVIEW_CRITERIA.map(
              ({ field, shortLabel }) =>
                `${shortLabel} ${formatRating(review[field])}`
            ).join(" · ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

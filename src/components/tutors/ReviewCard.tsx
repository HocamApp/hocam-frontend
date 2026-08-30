"use client";

import { Review } from "@/types";
import { formatDate, formatRating, formatRelativeDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/tutors/RatingStars";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RatingStars rating={review.rating} />
            <span className="text-body font-medium">
              {formatRating(review.rating)}
            </span>
          </div>
          <span
            className="text-small text-ink-mid"
            title={formatDate(review.created_at)}
          >
            {formatRelativeDate(review.created_at)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-body font-medium text-ink-mid">Öğrenci</p>
          {review.subject && (
            <span className="inline-flex items-center rounded-pill border border-line px-3 py-1 text-label text-ink">
              {review.subject.name} · {review.subject.exam_type}
            </span>
          )}
        </div>
        {review.comment && <p className="mt-2 text-body">{review.comment}</p>}
      </CardContent>
    </Card>
  );
}

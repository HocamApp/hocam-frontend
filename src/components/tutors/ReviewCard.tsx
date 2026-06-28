"use client";

import { Review } from "@/types";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} yıldız`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <span key={i} className="text-amber-500">
            ★
          </span>
        ) : (
          <span key={i} className="text-muted-foreground/60">☆</span>
        )
      )}
    </span>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-2 flex items-center justify-between">
          <Stars rating={review.rating} />
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
        <p className="mt-1 text-sm">{review.comment}</p>
      </CardContent>
    </Card>
  );
}

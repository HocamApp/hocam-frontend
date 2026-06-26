"use client";

import { Review } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
          <span className="text-sm text-muted-foreground">
            {formatDate(review.created_at)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">Öğrenci</p>
          {review.subject && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {review.subject.name} · {review.subject.exam_type}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm">{review.comment}</p>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SubjectRatingSummary } from "@/types";
import { formatRating } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/tutors/RatingStars";

const SUBJECT_PREVIEW_COUNT = 5;

export function SubjectRatingBreakdown({
  subjectRatings,
}: {
  subjectRatings: SubjectRatingSummary[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded
    ? subjectRatings
    : subjectRatings.slice(0, SUBJECT_PREVIEW_COUNT);
  const hasMore = subjectRatings.length > SUBJECT_PREVIEW_COUNT;

  return (
    <div>
      <h3 className="text-base font-semibold">Derslere Göre Puan</h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Hocanın farklı derslerde aldığı değerlendirme ortalamaları
      </p>

      {subjectRatings.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed bg-muted/30 p-6">
          <p className="text-sm text-muted-foreground">
            Bu hoca için ders bazlı değerlendirme henüz oluşmadı.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((sr) => (
            <div
              key={sr.subject.id}
              className="rounded-lg border bg-card p-4 shadow-sm sm:grid sm:grid-cols-[minmax(0,190px)_1fr_auto] sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="truncate font-medium">{sr.subject.name}</p>
                <Badge variant="secondary" className="text-xs font-normal">
                  {sr.subject.exam_type}
                </Badge>
              </div>
              <div className="mt-3 flex items-center gap-3 sm:mt-0">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{
                      width: `${Math.min((sr.average / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  %{Math.round(sr.percentage_of_reviews)} yorum
                </span>
              </div>
              <div className="mt-3 sm:mt-0 sm:text-right">
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <RatingStars rating={sr.average} />
                  <span className="font-medium">{formatRating(sr.average)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sr.count} değerlendirme
                </p>
              </div>
            </div>
          ))}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <>
                  Daha az göster
                  <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Tüm ders puanlarını göster
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

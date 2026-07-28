"use client";

import { Button } from "@/components/ui/button";
import type { HocaBulReviewRow } from "@/types/hocaBul";

export interface ReviewSummaryProps {
  rows: readonly HocaBulReviewRow[];
  onEdit: (stepId: HocaBulReviewRow["stepId"]) => void;
}

export function ReviewSummary({ rows, onEdit }: ReviewSummaryProps) {
  return (
    <div aria-label="Yanıt özeti" className="w-full space-y-4">
      {rows.map((row) => {
        const headingId = `hoca-bul-review-${row.stepId}`;
        return (
          <section
            key={row.stepId}
            aria-labelledby={headingId}
            className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <h2 id={headingId} className="text-sm font-semibold text-muted-foreground">
                {row.label}
              </h2>
              <p className="mt-1 whitespace-normal break-words text-base font-medium leading-7 text-foreground">
                {row.value}
              </p>
              {row.detail ? (
                <p className="mt-1 whitespace-normal break-words text-sm leading-6 text-muted-foreground">
                  {row.detail}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              aria-label={`${row.label} bölümünü düzenle`}
              className="min-h-11 shrink-0 self-start rounded-xl"
              onClick={() => onEdit(row.stepId)}
            >
              Düzenle
            </Button>
          </section>
        );
      })}
    </div>
  );
}

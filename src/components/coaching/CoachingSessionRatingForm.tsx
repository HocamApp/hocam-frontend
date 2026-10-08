"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  RATING_CRITERIA,
  RATING_CRITERIA_LABELS,
  type CoachingRatingCriterion,
  type CoachingSessionRatingScores,
} from "@/lib/coachingApi";

type DraftScores = Partial<Record<CoachingRatingCriterion, number>>;

function isComplete(scores: DraftScores): scores is CoachingSessionRatingScores {
  return RATING_CRITERIA.every((criterion) => typeof scores[criterion] === "number");
}

/**
 * Seven criteria, every one required by the API. Nothing is pre-selected:
 * a default of 3 used to submit a "neutral" score the student never gave.
 */
export function CoachingSessionRatingForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (scores: CoachingSessionRatingScores, comment: string) => void;
  isPending: boolean;
}) {
  const [scores, setScores] = useState<DraftScores>({});
  const [comment, setComment] = useState("");
  const complete = isComplete(scores);
  const remaining = RATING_CRITERIA.filter((criterion) => scores[criterion] === undefined).length;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (isComplete(scores)) onSubmit(scores, comment);
      }}
    >
      {RATING_CRITERIA.map((criterion) => (
        <fieldset
          key={criterion}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <legend className="float-left text-body text-ink sm:float-none">
            {RATING_CRITERIA_LABELS[criterion]}
          </legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = (scores[criterion] ?? 0) >= value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${RATING_CRITERIA_LABELS[criterion]}: ${value} / 5`}
                  aria-pressed={scores[criterion] === value}
                  onClick={() => setScores((current) => ({ ...current, [criterion]: value }))}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2",
                    selected ? "border-pink bg-pink text-white" : "border-line text-ink-mid hover:border-ink",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Herkese açık yorum (isteğe bağlı, yalnız uygun dönemlerde yayınlanır)"
        aria-label="Herkese açık yorum"
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled={!complete || isPending}>
          Değerlendirmeyi gönder
        </Button>
        {!complete ? (
          <p className="text-small text-ink-mid" aria-live="polite">
            Göndermek için {remaining} ölçüt daha puanla.
          </p>
        ) : null}
      </div>
    </form>
  );
}

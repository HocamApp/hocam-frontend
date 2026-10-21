"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
 * Seven criteria, every one required by the API (so seven taps, not
 * thirty-five). Nothing is pre-selected: a default of 3 used to submit a
 * "neutral" score the student never gave. `onProgress` tells the row around the
 * form how many are answered. Plain class strings: tailwind-merge would drop a
 * named size next to a colour.
 */
export function CoachingSessionRatingForm({
  onSubmit,
  isPending,
  onProgress,
}: {
  onSubmit: (scores: CoachingSessionRatingScores, comment: string) => void;
  isPending: boolean;
  onProgress?: (answered: number) => void;
}) {
  const formId = useId();
  const [scores, setScores] = useState<DraftScores>({});
  const [comment, setComment] = useState("");
  const complete = isComplete(scores);
  const remaining = RATING_CRITERIA.filter((criterion) => scores[criterion] === undefined).length;

  const choose = (criterion: CoachingRatingCriterion, value: number) => {
    const next = { ...scores, [criterion]: value };
    setScores(next);
    onProgress?.(RATING_CRITERIA.filter((key) => next[key] !== undefined).length);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (isComplete(scores)) onSubmit(scores, comment);
      }}
    >
      <div className="divide-y divide-line">
        {RATING_CRITERIA.map((criterion) => (
          <div
            key={criterion}
            role="group"
            aria-labelledby={`${formId}-${criterion}`}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <span id={`${formId}-${criterion}`} className="text-body text-ink">
              {RATING_CRITERIA_LABELS[criterion]}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => {
                const selected = (scores[criterion] ?? 0) >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${RATING_CRITERIA_LABELS[criterion]}: ${value} / 5`}
                    aria-pressed={scores[criterion] === value}
                    onClick={() => choose(criterion, value)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-body font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 ${
                      selected ? "border-pink-deep bg-pink-deep text-white" : "border-line bg-surface text-ink-mid hover:border-ink"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Yorumun (isteğe bağlı)"
          aria-label="Herkese açık yorum"
        />
        <p className="text-small text-ink-mid">
          Yazılı yorumun, ilk koçluk dönemin tamamlanınca herkese açık olabilir.
        </p>
      </div>
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

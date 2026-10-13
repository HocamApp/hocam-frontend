"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  RecurringLessonSlotPicker,
  type RecurringSelection,
} from "@/components/lessons/RecurringLessonSlotPicker";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { PlaceLessonsFailure, placeLessons } from "@/lib/placeLessonsApi";
import {
  PLACE_FLOW,
  PLACE_PAGES,
  placeFailureMessage,
  placedSummary,
} from "@/lib/placeLessonsCopy";
import { PAYMENTS_HREF } from "@/lib/refundRoutes";
import { fetchTutorById } from "@/lib/tutorsApi";
import type { PackagePurchase, PlaceLessonsResult } from "@/types";

/**
 * Put a package's unplaced credits on the tutor's free hours. The student picks
 * the weekly hours (the picker offers only hours free every week of the term),
 * the server writes the lessons under the tutor's lock and answers how many it
 * placed. Nothing is written unless every hour is free: a refusal says which
 * day and leaves the student on this screen with their hours still selected.
 */
export function PlaceLessonsFlow({ purchase }: { purchase: PackagePurchase }) {
  const queryClient = useQueryClient();
  const perWeek = purchase.plan.lessons_per_week ?? 0;
  const termDays = purchase.plan.duration_days ?? 0;

  const { data: tutor } = useQuery({
    queryKey: ["tutor", purchase.tutor.id],
    queryFn: () => fetchTutorById(purchase.tutor.id),
    enabled: !purchase.tutor.subjects?.length,
  });
  const subjects = purchase.tutor.subjects?.length ? purchase.tutor.subjects : (tutor?.subjects ?? []);

  const [slots, setSlots] = useState<RecurringSelection[]>([]);
  const [subjectId, setSubjectId] = useState<string>("");
  const effectiveSubject = subjectId || (subjects.length === 1 ? String(subjects[0].id) : "");
  const [result, setResult] = useState<PlaceLessonsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set the moment the button is pressed, before React re-renders: two quick
  // presses must be one request, not two (the second would be refused anyway,
  // but the student would see the refusal instead of the result).
  const inFlight = useRef(false);

  const place = useMutation({
    mutationFn: () => placeLessons(purchase.id, { subject: effectiveSubject, slots }),
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    },
    onSettled: () => {
      inFlight.current = false;
    },
    onError: (err) => {
      setError(
        err instanceof PlaceLessonsFailure
          ? placeFailureMessage(err)
          : "Dersler yerleştirilemedi. Lütfen tekrar dene."
      );
      // The hours may have changed under the student; ask the server again.
      void queryClient.invalidateQueries({ queryKey: ["tutor-recurring-slots"] });
    },
  });

  if (!perWeek || !termDays) {
    return <ErrorMessage message={PLACE_PAGES.noWeeklyPlan} />;
  }

  if (result) {
    return (
      <div className="space-y-4" role="status">
        {placedSummary(result).map((line) => (
          <p key={line} className="text-sm leading-6 text-ink">
            {line}
          </p>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/student">Derslerimi gör</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PAYMENTS_HREF}>{PLACE_PAGES.backToPackages}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const blockedReason = !effectiveSubject
    ? PLACE_FLOW.needSubject
    : slots.length === 0
      ? PLACE_FLOW.needHours
      : null;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-ink-mid">{PLACE_FLOW.summary(purchase.remaining_credits)}</p>

      <RecurringLessonSlotPicker
        tutor={purchase.tutor}
        durationMinutes={purchase.plan.lesson_duration_minutes}
        termDays={termDays}
        requiredCount={perWeek}
        lessonsPerWeek={perWeek}
        subjects={subjects}
        selectedSubjectId={effectiveSubject}
        onSubjectChange={setSubjectId}
        value={slots}
        onChange={setSlots}
        priceLabel={PLACE_FLOW.priceLabel}
      />

      <p className="text-sm leading-6 text-ink-mid">{PLACE_FLOW.rule}</p>

      {error ? <ErrorMessage message={error} /> : null}
      {blockedReason ? <p className="text-sm text-ink-mid">{blockedReason}</p> : null}

      <Button
        type="button"
        disabled={Boolean(blockedReason) || place.isPending}
        aria-busy={place.isPending || undefined}
        onClick={() => {
          if (blockedReason || place.isPending || inFlight.current) return;
          inFlight.current = true;
          place.mutate();
        }}
      >
        {place.isPending ? PLACE_FLOW.submitting : PLACE_FLOW.submit}
      </Button>
    </div>
  );
}

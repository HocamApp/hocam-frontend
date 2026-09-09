"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";

import { RecurringLessonSlotPicker } from "@/components/lessons/RecurringLessonSlotPicker";
import type { RecurringSelection } from "@/components/lessons/RecurringLessonSlotPicker";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { fetchTutorById } from "@/lib/tutorsApi";
import { formatPrice } from "@/lib/utils";
import {
  MOST_POPULAR_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
  normalizeWeeklyLessonOption,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import {
  decodeCheckoutSchedule,
  encodeCheckoutSchedule,
} from "@/lib/checkoutSchedule";
import { cn } from "@/lib/utils";

const LESSON_DURATION_MINUTES = 40;

/**
 * The step that was missing: when do these lessons actually happen.
 *
 * A package is bought as "N lessons a week for D days", and until now nothing
 * asked which hours. A student left checkout with twelve credits and no
 * lessons on the calendar, and the tutor accepted a price without being told
 * when they were expected to teach.
 *
 * It comes before the coaching and package screens because the answer changes
 * whether the package is worth buying at all: a tutor with no free Thursday
 * evening is no use to a student who only has Thursday evenings, and finding
 * that out after choosing a plan wastes the whole flow.
 *
 * Weekly lesson count is asked here rather than read from a later screen for
 * the same reason — it decides how many slots to pick. It travels on in the
 * URL, like every other choice in this flow, and the package screen picks it
 * up already set.
 */
function ScheduleStepContent({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkoutEnabled: coachingCheckoutEnabled } = useCoachingFlag();

  const [perWeek, setPerWeek] = useState<WeeklyLessonOption>(() =>
    normalizeWeeklyLessonOption(searchParams.get("per_week"))
  );
  const initial = useMemo(
    () => decodeCheckoutSchedule(searchParams.get("schedule")),
    // Read once: after this the component owns the choice, and re-reading on
    // every param change would fight the student's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [subjectId, setSubjectId] = useState<string>(initial?.subjectId ?? "");
  const [slots, setSlots] = useState<RecurringSelection[]>(initial?.slots ?? []);

  const termDays = Number(searchParams.get("duration")) || MOST_POPULAR_DURATION_DAYS;

  const { data: tutor, isLoading } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => fetchTutorById(tutorId),
  });

  const subjects = tutor?.subjects ?? [];
  const effectiveSubjectId =
    subjectId || (subjects.length === 1 ? String(subjects[0].id) : "");

  const nextHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("per_week", String(perWeek));
    if (effectiveSubjectId && slots.length === perWeek) {
      params.set(
        "schedule",
        encodeCheckoutSchedule({ subjectId: effectiveSubjectId, slots })
      );
    } else {
      params.delete("schedule");
    }
    const query = params.toString();
    const base =
      tutor?.offers_coaching && coachingCheckoutEnabled
        ? `/tutors/${tutorId}/checkout/coaching`
        : `/tutors/${tutorId}/checkout`;
    return `${base}${query ? `?${query}` : ""}`;
  }, [searchParams, perWeek, effectiveSubjectId, slots, tutor, coachingCheckoutEnabled, tutorId]);

  const complete = Boolean(effectiveSubjectId) && slots.length === perWeek;

  if (isLoading || !tutor) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/tutors/${tutorId}`}
        className="inline-flex items-center gap-1.5 text-[0.875rem] text-ink-mid transition-colors duration-[120ms] hover:text-ink"
      >
        <ArrowLeft size={16} weight="regular" />
        Hoca profiline dön
      </Link>

      <h1 className="mt-6 text-h2">Ders programın</h1>
      <p className="mt-1 text-[0.875rem] text-ink-mid">
        Haftada kaç ders alacağını ve bu derslerin hangi gün ve saatte olacağını seç.
        Aynı saatler paket boyunca her hafta tekrarlanır.
      </p>

      <div className="mt-6">
        <p className="text-label text-ink-mid">Haftada kaç ders?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKLY_LESSON_OPTIONS.map((option) => {
            const active = option === perWeek;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setPerWeek(option);
                  // The number of slots to pick just changed; anything already
                  // chosen beyond the new count would be silently dropped at
                  // submit, so trim it here where the student can see it.
                  setSlots((current) => current.slice(0, option));
                }}
                className={cn(
                  "rounded-pill border px-4 py-2 text-[0.875rem] tabular-nums transition-colors duration-[120ms]",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line text-ink hover:border-ink"
                )}
              >
                {option} ders
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <RecurringLessonSlotPicker
          tutor={tutor}
          durationMinutes={LESSON_DURATION_MINUTES}
          termDays={termDays}
          requiredCount={perWeek}
          subjects={subjects}
          selectedSubjectId={effectiveSubjectId}
          onSubjectChange={setSubjectId}
          value={slots}
          onChange={setSlots}
          priceLabel={`${formatPrice(Number(tutor.hourly_price))} / ${LESSON_DURATION_MINUTES} dk`}
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.875rem] text-ink-mid">
          {complete
            ? "Programın hazır. Fiyatı bir sonraki adımda göreceksin."
            : `Devam etmek için ${perWeek} haftalık ders saati ve bir ders konusu seç.`}
        </p>
        <Button asChild disabled={!complete} className="w-full sm:w-auto">
          <Link
            href={nextHref}
            aria-disabled={!complete}
            onClick={(event) => {
              if (!complete) event.preventDefault();
            }}
          >
            Devam et
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ScheduleStepPage({ params }: { params: { id: string } }) {
  return (
    <RouteGuard requireRole="student">
      <ScheduleStepContent tutorId={params.id} />
    </RouteGuard>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";

import { RecurringLessonSlotPicker } from "@/components/lessons/RecurringLessonSlotPicker";
import type { RecurringSelection } from "@/components/lessons/RecurringLessonSlotPicker";
import {
  PrivateLessonPlanCard,
  type WeeklyOptionState,
} from "@/components/checkout/PrivateLessonPlanCard";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { fetchTutorById } from "@/lib/tutorsApi";
import { fetchTutorOfferedPlans, filterMatrixPlans } from "@/lib/paymentsApi";
import { fetchTutorRecurringSlots } from "@/lib/lessonsApi";
import { cn, formatPrice } from "@/lib/utils";
import {
  WEEKLY_LESSON_OPTIONS,
  normalizeWeeklyLessonOption,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import {
  decodeCheckoutSchedule,
  encodeCheckoutSchedule,
} from "@/lib/checkoutSchedule";

const LESSON_DURATION_MINUTES = 40;

// Four weeks, not the package term. The term (2 hafta / 1 ay / 3 ay / 6 ay) is
// chosen on the screen after this one, so computing a rhythm against 90 days
// here was asserting a length nobody had picked. A weekly rhythm is a weekly
// rhythm; the server re-checks the real term when the request is created.
const LOOKAHEAD_DAYS = 28;

/**
 * The step that was missing: when do these lessons actually happen.
 *
 * It reveals itself in three parts rather than all at once. Subject first,
 * because it is the only question with no dependencies; then how many lessons
 * a week, because that decides how many hours to pick; then the hours. Showing
 * all three together made the screen read as a form to fill rather than a
 * decision to make, and put the subject — the one thing that must be chosen —
 * in the least prominent corner.
 */
function ScheduleStepContent({ tutorId }: { tutorId: string }) {
  const searchParams = useSearchParams();
  const { checkoutEnabled: coachingCheckoutEnabled } = useCoachingFlag();

  const initial = useMemo(
    () => decodeCheckoutSchedule(searchParams.get("schedule")),
    // Read once: after this the page owns the choice, and re-reading on every
    // param change would fight the student's edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [subjectId, setSubjectId] = useState<string>(initial?.subjectId ?? "");
  const [perWeek, setPerWeek] = useState<WeeklyLessonOption | null>(
    searchParams.get("per_week") ? normalizeWeeklyLessonOption(searchParams.get("per_week")) : null
  );
  const [slots, setSlots] = useState<RecurringSelection[]>(initial?.slots ?? []);

  const { data: tutor, isLoading } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => fetchTutorById(tutorId),
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["tutor-offered-plans", tutorId],
    queryFn: () => fetchTutorOfferedPlans(tutorId),
  });

  // How many distinct weekly hours this tutor actually has open. Without it the
  // page would offer 6 lessons a week to a tutor with four free hours, and the
  // student would only find out after picking.
  const { data: recurring } = useQuery({
    queryKey: ["tutor-recurring-slots", tutorId, LOOKAHEAD_DAYS, LESSON_DURATION_MINUTES],
    queryFn: () =>
      fetchTutorRecurringSlots(tutorId, {
        termDays: LOOKAHEAD_DAYS,
        durationMinutes: LESSON_DURATION_MINUTES,
      }),
  });

  const subjects = tutor?.subjects ?? [];
  const soleSubjectId = subjects.length === 1 ? String(subjects[0].id) : "";
  const effectiveSubjectId = subjectId || soleSubjectId;

  const freeHourCount = useMemo(
    () =>
      (recurring?.candidates ?? []).filter(
        (candidate) => candidate.free_occurrences === candidate.total_occurrences
      ).length,
    [recurring]
  );

  const optionState = useMemo(() => {
    const offeredCadences = new Set(
      filterMatrixPlans(plans).map((plan) => plan.lessons_per_week)
    );
    const state: Record<number, WeeklyOptionState> = {};
    for (const count of WEEKLY_LESSON_OPTIONS) {
      state[count] = {
        offered: offeredCadences.has(count),
        schedulable: freeHourCount >= count,
      };
    }
    return state;
  }, [plans, freeHourCount]);

  // A cadence carried in from a deep link may be one this tutor does not sell.
  // Drop it rather than letting the student pick hours for a package that does
  // not exist — the checkout screen would silently re-snap it and throw the
  // schedule away.
  useEffect(() => {
    if (perWeek === null || plansLoading) return;
    const state = optionState[perWeek];
    if (!state?.offered || !state?.schedulable) {
      setPerWeek(null);
      setSlots([]);
    }
  }, [perWeek, optionState, plansLoading]);

  const nextHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (perWeek) params.set("per_week", String(perWeek));
    if (effectiveSubjectId && perWeek && slots.length === perWeek) {
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

  const complete = Boolean(effectiveSubjectId) && perWeek !== null && slots.length === perWeek;

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

      {/* 1 — subject */}
      {subjects.length > 1 && (
        <section className="mt-8">
          <h2 className="text-h3">Hangi dersi alacaksın?</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {subjects.map((subject) => {
              const active = String(subject.id) === effectiveSubjectId;
              return (
                <button
                  key={String(subject.id)}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSubjectId(String(subject.id));
                  }}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-input border px-4 py-3 text-left text-[0.9375rem] transition-colors duration-[120ms]",
                    active
                      ? "border-gold bg-gold text-gold-ink"
                      : "border-line bg-surface text-ink hover:border-ink"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                  <span
                    className={cn(
                      "shrink-0 text-[0.75rem]",
                      active ? "text-gold-ink/70" : "text-ink-mid"
                    )}
                  >
                    {subject.exam_type}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2 — weekly lesson count */}
      {effectiveSubjectId && (
        <section className="mt-8">
          <h2 className="text-h3">Haftada kaç ders?</h2>
          <div className="mt-3">
            {plansLoading ? (
              <div className="h-40 animate-pulse rounded-card bg-skeleton" aria-hidden />
            ) : (
              <PrivateLessonPlanCard
                value={perWeek ?? (WEEKLY_LESSON_OPTIONS[0] as WeeklyLessonOption)}
                onChange={(count) => {
                  setPerWeek(count);
                  // The number of hours to pick just changed; anything chosen
                  // beyond the new count would be dropped at submit, so trim it
                  // here where the student can see it happen.
                  setSlots((current) => current.slice(0, count));
                }}
                optionState={optionState}
                lessonDurationMinutes={LESSON_DURATION_MINUTES}
              />
            )}
          </div>
        </section>
      )}

      {/* 3 — the hours */}
      {effectiveSubjectId && perWeek !== null && (
        <section className="mt-8">
          <h2 className="text-h3">Hangi gün ve saatte?</h2>
          <div className="mt-3">
            <RecurringLessonSlotPicker
              tutor={tutor}
              durationMinutes={LESSON_DURATION_MINUTES}
              termDays={LOOKAHEAD_DAYS}
              requiredCount={perWeek}
              value={slots}
              onChange={setSlots}
              priceLabel={`${formatPrice(Number(tutor.hourly_price))} / ${LESSON_DURATION_MINUTES} dk`}
            />
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.875rem] text-ink-mid">
          {complete
            ? "Programın hazır. Paket süresini ve fiyatı bir sonraki adımda seçeceksin."
            : !effectiveSubjectId
              ? "Önce bir ders konusu seç."
              : perWeek === null
                ? "Haftada kaç ders alacağını seç."
                : `${perWeek} haftalık ders saati seç.`}
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

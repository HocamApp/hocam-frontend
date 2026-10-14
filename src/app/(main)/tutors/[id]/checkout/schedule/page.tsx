"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";

import { RecurringLessonSlotPicker, nonOverlappingCount } from "@/components/lessons/RecurringLessonSlotPicker";
import type { RecurringSelection } from "@/components/lessons/RecurringLessonSlotPicker";
import { PackageTermChoice } from "@/components/checkout/PackageTermChoice";
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
  MOST_POPULAR_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
  normalizeWeeklyLessonOption,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import {
  decodeCheckoutSchedule,
  encodeCheckoutSchedule,
} from "@/lib/checkoutSchedule";

const LESSON_DURATION_MINUTES = 40;

// How many weekly hours the tutor has, for the "how many lessons a week" buttons,
// is judged over four weeks: it is asked before the term is known. The hours the
// student then picks are asked for the real term (below), so what is offered is
// free for the whole package.
const LOOKAHEAD_DAYS = 28;

// The earliest a package's first lesson can be is a day from now (the same rule
// the server applies when it holds and books the hours), so the tutor's hours
// are looked at from the day after: an hour that has already gone by today must
// not take its whole weekly slot out of the four weeks, only that one lesson,
// which the package would not use anyway.
const EARLIEST_FIRST_LESSON_HOURS = 24;

function firstWindowDay(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(
    new Date(Date.now() + EARLIEST_FIRST_LESSON_HOURS * 3_600_000)
  );
}

/**
 * The step that was missing: when do these lessons actually happen.
 *
 * It reveals itself in four parts rather than all at once. Subject first,
 * because it is the only question with no dependencies; then how many lessons
 * a week, because that decides how many hours to pick; then how long the
 * package runs, because a Thursday that is free for a month may be taken in the
 * fifth week of six months; then the hours, which are only the ones free for
 * the whole package. Showing everything together made the screen read as a form
 * to fill rather than a decision to make, and put the subject — the one thing
 * that must be chosen — in the least prominent corner.
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
  // The package term in days. Carried in the URL like the rest; null until the
  // student has a weekly count to choose it for.
  const [termDays, setTermDays] = useState<number | null>(() => {
    const raw = Number(searchParams.get("duration"));
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  });

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
  // Read once: a key that moved with the clock would refetch for nothing.
  const [windowStart] = useState(firstWindowDay);
  const { data: recurring, isLoading: recurringLoading } = useQuery({
    queryKey: ["tutor-recurring-slots", tutorId, LOOKAHEAD_DAYS, LESSON_DURATION_MINUTES, windowStart],
    queryFn: () =>
      fetchTutorRecurringSlots(tutorId, {
        start: windowStart,
        termDays: LOOKAHEAD_DAYS,
        durationMinutes: LESSON_DURATION_MINUTES,
      }),
  });

  // The terms the tutor sells at the chosen weekly count.
  const termPlans = useMemo(
    () => filterMatrixPlans(plans).filter((plan) => plan.lessons_per_week === perWeek),
    [plans, perWeek]
  );

  // A term that is not on offer for this cadence (a deep link, a changed weekly
  // count) becomes the popular one, or the shortest if that is not sold.
  useEffect(() => {
    if (perWeek === null || plansLoading || termPlans.length === 0) return;
    const offered = termPlans.map((plan) => plan.duration_days);
    if (termDays !== null && offered.includes(termDays)) return;
    setTermDays(
      offered.includes(MOST_POPULAR_DURATION_DAYS)
        ? MOST_POPULAR_DURATION_DAYS
        : (offered[0] ?? null)
    );
  }, [perWeek, plansLoading, termPlans, termDays]);

  const subjects = tutor?.subjects ?? [];
  const soleSubjectId = subjects.length === 1 ? String(subjects[0].id) : "";
  const effectiveSubjectId = subjectId || soleSubjectId;

  // Hours that can actually be taken together. Counting every candidate
  // overstated capacity while the grid offered overlapping starts, so a tutor
  // with one free stretch looked able to teach three lessons a week in it.
  const freeHourCount = useMemo(
    () =>
      nonOverlappingCount(
        (recurring?.candidates ?? []).filter(
          (candidate) => candidate.free_occurrences === candidate.total_occurrences
        ),
        LESSON_DURATION_MINUTES
      ),
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
        // Until the hours are known nothing can be said against a count; and if
        // they cannot be read, the server still refuses what cannot be held.
        schedulable: recurring ? freeHourCount >= count : true,
      };
    }
    return state;
  }, [plans, freeHourCount, recurring]);

  // A cadence carried in from a deep link may be one this tutor does not sell.
  // Drop it rather than letting the student pick hours for a package that does
  // not exist — the checkout screen would silently re-snap it and throw the
  // schedule away.
  useEffect(() => {
    // Not before the hours are known: until then "cannot be filled" is only the
    // absence of an answer, and the count from the link would be thrown away.
    if (perWeek === null || plansLoading || recurringLoading) return;
    const state = optionState[perWeek];
    if (!state?.offered || !state?.schedulable) {
      setPerWeek(null);
      setSlots([]);
    }
  }, [perWeek, optionState, plansLoading, recurringLoading]);

  const nextHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (perWeek) params.set("per_week", String(perWeek));
    if (termDays) params.set("duration", String(termDays));
    if (effectiveSubjectId && perWeek && termDays && slots.length === perWeek) {
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
  }, [
    searchParams,
    perWeek,
    termDays,
    effectiveSubjectId,
    slots,
    tutor,
    coachingCheckoutEnabled,
    tutorId,
  ]);

  const complete =
    Boolean(effectiveSubjectId) &&
    perWeek !== null &&
    termDays !== null &&
    slots.length === perWeek;

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
                value={perWeek}
                checking={recurringLoading}
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

      {/* 3 — how long the package runs */}
      {effectiveSubjectId && perWeek !== null && (
        <section className="mt-8">
          <h2 className="text-h3">Paket ne kadar sürsün?</h2>
          <p className="mt-1 text-[0.875rem] text-ink-mid">
            Önce süreyi seç. Sonraki adımda yalnız bu sürenin tamamında boş olan saatleri görürsün.
          </p>
          <div className="mt-3">
            {plansLoading ? (
              <div className="h-40 animate-pulse rounded-card bg-skeleton" aria-hidden />
            ) : (
              <PackageTermChoice
                plans={termPlans}
                hourlyPrice={Number(tutor.hourly_price)}
                value={termDays}
                onChange={setTermDays}
              />
            )}
          </div>
        </section>
      )}

      {/* 4 — the hours */}
      {effectiveSubjectId && perWeek !== null && termDays !== null && (
        <section className="mt-8">
          <h2 className="text-h3">Hangi gün ve saatte?</h2>
          <div className="mt-3">
            <RecurringLessonSlotPicker
              tutor={tutor}
              durationMinutes={LESSON_DURATION_MINUTES}
              termDays={termDays}
              lessonsPerWeek={perWeek}
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
            ? "Programın hazır. Özet adımında fiyatı ve varsa indirim kodunu görürsün."
            : !effectiveSubjectId
              ? "Önce bir ders konusu seç."
              : perWeek === null
                ? "Haftada kaç ders alacağını seç."
                : termDays === null
                  ? "Paket süresini seç."
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

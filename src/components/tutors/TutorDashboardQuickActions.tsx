"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

import { TutorCalendarManagement } from "@/components/tutor-calendar/TutorCalendarManagement";
import { AvailabilityDialogHint } from "@/components/tutors/AvailabilityDialogHint";
import { TutorSetupTour } from "@/components/tutors/TutorSetupTour";
import { istanbulToday, type TutorCalendarEvent, type TutorTimeOff } from "@/lib/tutorCalendar";

// Stable references: the calendar page feeds the busy list and the "lessons
// outside your availability" warning, the dashboard has neither in hand.
const NO_TIME_OFF: TutorTimeOff[] = [];
const NO_EVENTS: TutorCalendarEvent[] = [];
const noop = () => {};

const linkClassName =
  "flex min-h-12 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-small font-medium transition-colors duration-[var(--duration-state)] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";

/**
 * The strip under the greeting on the tutor dashboard: the two places a tutor
 * goes to manage the work, and the two things they most often need to change
 * without opening the calendar. Availability is the pink primary because an
 * empty availability is what keeps a tutor from getting students; adding a
 * busy block is the outline alternative.
 */
export function TutorDashboardQuickActions() {
  const bookingsRef = useRef<HTMLAnchorElement>(null);
  const packagesRef = useRef<HTMLAnchorElement>(null);
  const availabilityRef = useRef<HTMLButtonElement>(null);
  const anchors = useMemo(() => ({ bookings: bookingsRef, packages: packagesRef, availability: availabilityRef }), []);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Hoca yönetimi" className="grid grid-cols-2 gap-3 lg:w-[28rem]">
        <Link ref={bookingsRef} href="/dashboard/tutor?tab=bookings" className={linkClassName}>
          Rezervasyonlar
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
        <Link ref={packagesRef} href="/dashboard/tutor/packages" className={linkClassName}>
          Paket ayarları
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      </nav>
      <TutorCalendarManagement
        date={istanbulToday()}
        timeOff={NO_TIME_OFF}
        events={NO_EVENTS}
        onChanged={noop}
        size="lg"
        availabilityButtonRef={availabilityRef}
        availabilityIntro={<AvailabilityDialogHint />}
        className="gap-3 max-sm:grid max-sm:grid-cols-1 lg:flex-nowrap"
      />
      <TutorSetupTour anchors={anchors} />
    </div>
  );
}

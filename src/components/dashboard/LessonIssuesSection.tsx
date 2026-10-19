"use client";

import { useState } from "react";
import { CaretDown, CaretUp, Prohibit } from "@phosphor-icons/react";

import { LessonListRow } from "@/components/dashboard/LessonListRow";
import { LessonStatusChip } from "@/components/dashboard/LessonStatusChip";
import {
  SectionBandCount,
  SectionBandHeading,
  sectionBandClass,
} from "@/components/shared/SectionBand";
import { Button } from "@/components/ui/button";
import { bookingDateParts } from "@/lib/bookingTime";
import { bookingStatusExplanation } from "@/lib/bookingStatusCopy";
import type { Booking } from "@/types";

const PAGE_SIZE = 5;

/**
 * Cancelled, auto-cancelled and disputed lessons.
 *
 * Nowhere on the dashboard before this; the only list lived in the lessons
 * workspace. It is a record, not a task, so it opens closed — an account with
 * dozens of cancellations should not meet them before its next lesson — and
 * wears the ink band, never the pink one that belongs to what is coming up.
 * The whole band is the toggle: the count says how much is behind it.
 */
export function LessonIssuesSection({ bookings }: { bookings: Booking[] }) {
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (bookings.length === 0) return null;
  const visible = bookings.slice(0, visibleCount);
  const Chevron = open ? CaretUp : CaretDown;

  return (
    <section
      aria-labelledby="lesson-issues-title"
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={sectionBandClass(
          "ink",
          "w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-paper",
        )}
      >
        <SectionBandHeading
          as="span"
          id="lesson-issues-title"
          title="İptal ve sorunlar"
          subtitle="İptal edilen, otomatik iptal olan ve itiraz ettiğin dersler."
          icon={<Prohibit className="size-5 shrink-0" weight="regular" aria-hidden="true" />}
        />
        <span className="flex shrink-0 items-center gap-3">
          <SectionBandCount tone="ink">{bookings.length}</SectionBandCount>
          <Chevron className="size-5" weight="regular" aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6">
          <ol className="divide-y divide-line">
            {visible.map((booking) => (
              <li key={booking.id}>
                <LessonListRow
                  booking={booking}
                  muted
                  chip={<LessonStatusChip status={booking.status} />}
                  meta={bookingDateParts(booking.start_time)?.year}
                  explanation={bookingStatusExplanation(booking.status)}
                />
              </li>
            ))}
          </ol>
          {bookings.length > visible.length && (
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              {bookings.length - visible.length} kayıt daha göster
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

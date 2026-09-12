"use client";

import { useState } from "react";
import { CaretDown, Prohibit } from "@phosphor-icons/react";

import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { LessonStatusChip } from "@/components/dashboard/LessonStatusChip";
import { Button } from "@/components/ui/button";
import { bookingDateLabel } from "@/lib/bookingTime";
import { bookingStatusExplanation } from "@/lib/bookingStatusCopy";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types";

const PAGE_SIZE = 5;

function tutorName(booking: Booking): string {
  return booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`.trim()
    : "Eğitmen bilgisi bekleniyor";
}

/**
 * Cancelled, auto-cancelled and disputed lessons.
 *
 * Nowhere on the dashboard before this; the only list lived in the lessons
 * workspace. It is a record, not a task, so it opens closed — an account with
 * dozens of cancellations should not meet them before its next lesson.
 */
export function LessonIssuesSection({ bookings }: { bookings: Booking[] }) {
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (bookings.length === 0) return null;
  const visible = bookings.slice(0, visibleCount);

  return (
    <section
      aria-labelledby="lesson-issues-title"
      className="rounded-card border border-line bg-surface p-6"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-input text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-line bg-paper text-ink-mid">
          <Prohibit className="size-4" weight="regular" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            id="lesson-issues-title"
            className="block text-h3-m text-ink md:text-h3"
          >
            İptal ve sorunlar
          </span>
          <span className="mt-0.5 block text-small text-ink-mid">
            İptal edilen, otomatik iptal olan ve itiraz ettiğin dersler.
          </span>
        </span>
        <span className="shrink-0 text-small tabular-nums text-ink-mid">
          {bookings.length}
        </span>
        <CaretDown
          className={cn(
            "size-4 shrink-0 text-ink-mid transition-transform [transition-duration:120ms]",
            open && "rotate-180",
          )}
          weight="regular"
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          <ol className="mt-4 divide-y divide-line border-t border-line">
            {visible.map((booking) => (
              <li key={booking.id} className="flex items-start gap-3 py-4">
                <ParticipantAvatar
                  name={tutorName(booking)}
                  avatarUrl={booking.tutor.profile_picture}
                  className="h-10 w-10 shrink-0 border border-line"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-body font-medium text-ink">
                      {booking.subject.name}
                    </p>
                    <LessonStatusChip status={booking.status} />
                  </div>
                  <p className="mt-0.5 truncate text-small text-ink-mid">
                    {tutorName(booking)} · {bookingDateLabel(booking.start_time)}
                  </p>
                  <p className="mt-1 text-small text-ink-mid">
                    {bookingStatusExplanation(booking.status)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {bookings.length > visible.length && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              {bookings.length - visible.length} kayıt daha göster
            </Button>
          )}
        </>
      )}
    </section>
  );
}

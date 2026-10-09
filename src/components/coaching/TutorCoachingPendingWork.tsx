"use client";

import Link from "next/link";
import { CaretRight, ClockCountdown, ArrowsClockwise } from "@phosphor-icons/react";

import { useTutorCoachingPendingWork } from "./useTutorCoachingPendingWork";

/** The two time-boxed request queues, at the top of the tutor's Talepler. */
export function TutorCoachingPendingWork() {
  const { time, reschedule } = useTutorCoachingPendingWork();
  const rows = [
    {
      href: "/dashboard/tutor/coaching/time-requests",
      label: "Saat istekleri",
      hint: "Uygun saat bulamayan öğrenciye 48 saat içinde saat öner.",
      count: time,
      icon: ClockCountdown,
    },
    {
      href: "/dashboard/tutor/coaching/reschedule-requests",
      label: "Saat değişikliği istekleri",
      hint: "Görüşme saatinden önce yanıtla; yanıtlanmayan istek düşer.",
      count: reschedule,
      icon: ArrowsClockwise,
    },
  ];
  return (
    <div className="grid overflow-hidden rounded-card border border-line bg-surface sm:grid-cols-2">
      {rows.map(({ href, label, hint, count, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex min-h-16 items-center gap-3 border-b border-line px-5 py-4 text-ink last:border-b-0 hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink sm:border-b-0 sm:[&:first-child]:border-r"
        >
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-body font-medium">
              {label}
              {count ? (
                <span className="ml-2 rounded-pill bg-pink px-2 text-label font-medium text-white">
                  {count} bekliyor
                </span>
              ) : null}
            </span>
            <span className="block text-small text-ink-mid">{hint}</span>
          </span>
          <CaretRight className="ml-auto h-4 w-4 shrink-0 text-ink-mid" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}

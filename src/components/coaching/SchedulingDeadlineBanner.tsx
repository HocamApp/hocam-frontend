"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { serverNow } from "@/lib/serverClock";

/**
 * The 7-day scheduling deadline countdown.
 *
 * The deadline itself is a server timestamp
 * (`CoachingSchedulingState.slot_selection_deadline_at`) — this component
 * only re-renders a "time remaining" label from it every second; it never
 * computes the deadline itself. If the server says the purchase is no
 * longer awaiting schedule, this banner should not be rendered at all —
 * that decision belongs to the caller.
 */
export function SchedulingDeadlineBanner({
  deadlineAt,
}: {
  deadlineAt: string | null;
}) {
  // The server's clock, not the browser's: a phone a few minutes off must
  // not show a deadline that has already passed (or has not).
  const [now, setNow] = useState(() => serverNow());

  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!deadlineAt) return null;

  const deadlineMs = new Date(deadlineAt).getTime();
  const remainingMs = deadlineMs - now;
  const expired = remainingMs <= 0;
  const expiringSoon = !expired && remainingMs < 24 * 60 * 60 * 1000;

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return (
    <Card
      className={cn(
        "border-line bg-surface",
        expired ? "border-error" : expiringSoon ? "border-gold" : undefined
      )}
    >
      <CardContent className="py-4">
        {expired ? (
          <p role="status" className="text-sm font-medium text-error">
            Saat seçme süren doldu. Koçluğun iptal ediliyor; ders paketin etkilenmez.
          </p>
        ) : (
          <p className="text-sm text-ink">
            <span className="font-medium">
              Saatini seçmen için {days} gün {hours} saat {minutes} dakikan kaldı.
            </span>{" "}
            <span className="text-ink-mid">
              Bu süre dolarsa koçluk otomatik iptal olur; ders paketin devam eder.
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

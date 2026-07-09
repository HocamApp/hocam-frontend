"use client";

import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { cn, formatDateLocal, getNext14Days, jsDayToBackendDay } from "@/lib/utils";
import type { AvailabilityRule, Booking } from "@/types";

const DAY_ABBREVIATIONS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function formatRuleTime(t: string): string {
  if (!t) return "";
  return t.slice(0, 5);
}

function formatBookingTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AvailabilityCalendarProps {
  availability: AvailabilityRule[];
  bookings: Booking[];
}

export function AvailabilityCalendar({ availability, bookings }: AvailabilityCalendarProps) {
  const days = getNext14Days();
  const todayStr = formatDateLocal(new Date());

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((d) => {
        const backendDay = jsDayToBackendDay(d.getDay());
        const dateStr = formatDateLocal(d);
        const isToday = dateStr === todayStr;

        const dayRules = availability
          .filter((r) => r.day_of_week === backendDay)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        const dayBookings = bookings
          .filter((b) => new Date(b.start_time).toDateString() === d.toDateString())
          .sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );

        return (
          <Card key={dateStr} className={cn(isToday && "border-primary")}>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {DAY_ABBREVIATIONS[backendDay]} {d.getDate()}
                </span>
                {isToday && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    Bugün
                  </span>
                )}
              </div>

              {dayRules.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">Müsait değil</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {dayRules.map((r) => (
                    <span
                      key={r.id}
                      className="rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground"
                    >
                      {formatRuleTime(r.start_time)}–{formatRuleTime(r.end_time)}
                    </span>
                  ))}
                </div>
              )}

              {dayBookings.length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  {dayBookings.map((b) => (
                    <div key={b.id} className="space-y-1">
                      <p className="truncate text-[11px] font-medium">
                        {formatBookingTime(b.start_time)} ·{" "}
                        {b.student.display_name || b.student.email}
                      </p>
                      <StatusBadge status={b.status} type="booking" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { DayAvailabilityDialog } from "@/components/tutors/DayAvailabilityDialog";
import { formatDateLocal, jsDayToBackendDay } from "@/lib/utils";
import {
  getDayAvailabilityStatus,
  bookedMinutesWithinRule,
  type DayBusyInterval,
} from "@/lib/availability";
import type { AvailabilityRule, Booking, BusyInterval } from "@/types";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const DAY_STATUS_LABELS: Record<string, string> = {
  available: "Müsait",
  partial: "Kısmen dolu",
  full: "Dolu",
  closed: "Kapalı",
  none: "Müsaitlik tanımlanmamış",
  past: "Geçmiş gün",
};

/** Booking states that actually occupy the tutor's time. */
const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in_progress"];

function dayRulesForDate(availability: AvailabilityRule[], date: Date) {
  const dateString = formatDateLocal(date);
  const dated = availability.filter((rule) => rule.specific_date === dateString);
  if (dated.length > 0) return dated;
  return availability.filter(
    (rule) => !rule.specific_date && rule.day_of_week === jsDayToBackendDay(date.getDay())
  );
}

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function AvailabilityCalendar({ availability, bookings = [], busyIntervals = [], editable = true, showBookings = true }: {
  availability: AvailabilityRule[];
  bookings?: Booking[];
  /** Privacy-minimal busy spans (no student identity) — the visitor side of
   *  the public tutor page passes these so full/partial days render without
   *  ever exposing who booked them. */
  busyIntervals?: BusyInterval[];
  editable?: boolean;
  showBookings?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);
  const planningEnd = useMemo(() => {
    const value = new Date(today);
    value.setMonth(value.getMonth() + 6);
    return value;
  }, [today]);

  // All busy time, normalised: own bookings (tutor view) plus privacy-minimal
  // busy intervals (visitor view). Hocam data only — never Google reads.
  const busyTime = useMemo<DayBusyInterval[]>(() => {
    const fromBookings = bookings
      .filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status))
      .map((booking) => {
        const start = new Date(booking.start_time);
        return {
          start,
          end: new Date(start.getTime() + booking.duration_minutes * 60_000),
        };
      });
    const fromIntervals = busyIntervals.map((interval) => ({
      start: new Date(interval.start_time),
      end: new Date(interval.end_time),
    }));
    return [...fromBookings, ...fromIntervals];
  }, [bookings, busyIntervals]);

  const isPastSelectedDate = selectedDate < today;
  const selectedRules = dayRulesForDate(availability, selectedDate);
  const selectedBusy = busyTime.filter((interval) => sameDay(interval.start, selectedDate));
  const selectedStatus = getDayAvailabilityStatus({
    date: selectedDate,
    today,
    rules: selectedRules,
    intervals: selectedBusy,
  });
  const selectedBookings = bookings.filter(
    (booking) => new Date(booking.start_time).toDateString() === selectedDate.toDateString()
  );

  // One forward sweep buckets every visible day by status — the calendar
  // colours and the legend both read from these modifiers.
  const modifiers = useMemo(() => {
    const available: Date[] = [];
    const partial: Date[] = [];
    const full: Date[] = [];
    const closed: Date[] = [];
    const booked: Date[] = [];
    for (let offset = 0; offset < 180; offset += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const dayBusy = busyTime.filter((interval) => sameDay(interval.start, date));
      const { status, hasBookings } = getDayAvailabilityStatus({
        date,
        today,
        rules: dayRulesForDate(availability, date),
        intervals: dayBusy,
      });
      if (status === "available") available.push(date);
      else if (status === "partial") partial.push(date);
      else if (status === "full") full.push(date);
      else if (status === "closed") closed.push(date);
      if (hasBookings) booked.push(date);
    }
    return { available, partial, full, closed, booked };
  }, [availability, busyTime, today]);

  const label = `${DAY_NAMES[jsDayToBackendDay(selectedDate.getDay())]} ${selectedDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`;

  return (
    // Two columns only when both fit comfortably (xl+). Below that the
    // detail panel stacked under the calendar instead of being squeezed into
    // an unreadable strip; `minmax(22rem, 1fr)` guarantees the panel a
    // readable minimum width when columns do kick in.
    <div className="grid gap-6 xl:grid-cols-[auto_minmax(22rem,1fr)]">
      <Card className="w-fit max-w-full">
        <CardContent className="p-3">
          <Calendar
            mode="single"
            size="lg"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            defaultMonth={today}
            // Past months stay navigable and selectable (view-only): the
            // "Geçmiş gün" state must be visible, not just unreachable.
            toDate={planningEnd}
            disabled={{ after: planningEnd }}
            numberOfMonths={1}
            modifiers={{ ...modifiers, past: { before: today } }}
            modifiersClassNames={{
              available: "[&>button]:bg-emerald-50 [&>button]:text-emerald-800 dark:[&>button]:bg-emerald-950/40 dark:[&>button]:text-emerald-200",
              partial: "[&>button]:bg-amber-50 [&>button]:text-amber-800 dark:[&>button]:bg-amber-950/40 dark:[&>button]:text-amber-200",
              full: "[&>button]:bg-muted [&>button]:text-muted-foreground [&>button]:line-through",
              closed: "[&>button]:bg-destructive/10 [&>button]:text-destructive",
              booked: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-primary",
              past: "[&>button]:text-muted-foreground/40",
            }}
          />
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground" aria-label="Takvim açıklaması">
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-emerald-500" /> Müsait</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-amber-500" /> Kısmen dolu</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-muted-foreground/60" /> Dolu</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-destructive" /> Kapalı</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-primary" /> Rezervasyon var</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-muted-foreground/30" /> Geçmiş gün</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-semibold"><CalendarIcon className="h-4 w-4 shrink-0 text-primary" /> <span className="break-words">{label}</span></p>
              <p className="mt-1 text-sm text-muted-foreground">
                {editable ? "Bu tarih için müsaitlik ve derslerin." : "Bu tarih için hocanın müsaitliği."}
              </p>
            </div>
            {editable && !isPastSelectedDate && <Button variant="outline" size="sm" className="shrink-0" onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-3.5 w-3.5" /> Düzenle</Button>}
          </div>
          <p className="text-sm" data-testid="availability-day-status" data-status={selectedStatus.status}>
            <span className="text-muted-foreground">Durum: </span>
            <span className="font-medium">{DAY_STATUS_LABELS[selectedStatus.status]}</span>
            {selectedStatus.hasBookings && <span className="text-muted-foreground"> · Rezervasyon var</span>}
          </p>
          {selectedStatus.status === "closed" ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Bu gün kapalı olarak işaretlenmiş.</p>
          ) : selectedRules.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Bu gün için müsaitlik tanımlanmamış.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedRules.map((rule) => {
                const ruleMinutes =
                  Number(rule.end_time?.slice(0, 2)) * 60 + Number(rule.end_time?.slice(3, 5)) -
                  (Number(rule.start_time?.slice(0, 2)) * 60 + Number(rule.start_time?.slice(3, 5)));
                const covered = bookedMinutesWithinRule(rule, selectedDate, selectedBusy);
                const slotStatus = covered >= ruleMinutes && ruleMinutes > 0 ? "full" : covered > 0 ? "partial" : "available";
                return (
                  <span
                    key={rule.id}
                    data-testid="availability-slot"
                    data-status={slotStatus}
                    aria-disabled={slotStatus === "full" ? true : undefined}
                    className={
                      slotStatus === "full"
                        ? "rounded-md border bg-muted px-2 py-1 text-sm tabular-nums text-muted-foreground line-through"
                        : slotStatus === "partial"
                          ? "rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-sm tabular-nums"
                          : "rounded-md border bg-muted/40 px-2 py-1 text-sm tabular-nums"
                    }
                  >
                    {rule.start_time?.slice(0, 5)}–{rule.end_time?.slice(0, 5)}
                    {slotStatus === "full" && <span className="ml-1 text-xs no-underline">· Dolu</span>}
                    {slotStatus === "partial" && <span className="ml-1 text-xs">· Kısmen dolu</span>}
                  </span>
                );
              })}
            </div>
          )}
          {!editable && (selectedStatus.status === "available" || selectedStatus.status === "partial") && (
            <p className="text-xs text-muted-foreground">
              Müsait saatlerden ders ayırtmak için sayfadaki rezervasyon butonunu kullan.
            </p>
          )}
          {showBookings && selectedBookings.length > 0 && <div className="space-y-2 border-t pt-4"><p className="text-sm font-semibold">Dersler</p>{selectedBookings.map((booking) => <div key={booking.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="min-w-0 break-words text-sm font-medium">{new Date(booking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {booking.student.display_name || booking.student.email}</span><StatusBadge status={booking.status} type="booking" /></div>)}</div>}
          {editable && (isPastSelectedDate ? <p className="text-xs text-muted-foreground">Geçmiş tarihler yalnızca görüntülenebilir.</p> : <p className="text-xs text-muted-foreground"><Pencil className="mr-1 inline h-3 w-3" /> Takvimde bir gün seçerek o güne özel saat veya kapalı gün tanımlayabilirsin.</p>)}
        </CardContent>
      </Card>
      {editable && !isPastSelectedDate && <DayAvailabilityDialog open={isEditing} onOpenChange={setIsEditing} dayOfWeek={jsDayToBackendDay(selectedDate.getDay())} date={formatDateLocal(selectedDate)} dayLabel={label} bookedIntervals={selectedBusy} />}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { DayAvailabilityDialog } from "@/components/tutors/DayAvailabilityDialog";
import { formatDateLocal, jsDayToBackendDay } from "@/lib/utils";
import type { AvailabilityRule, Booking } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function dayRulesForDate(availability: AvailabilityRule[], date: Date) {
  const dateString = formatDateLocal(date);
  const dated = availability.filter((rule) => rule.specific_date === dateString);
  if (dated.length > 0) return dated;
  return availability.filter(
    (rule) => !rule.specific_date && rule.day_of_week === jsDayToBackendDay(date.getDay())
  );
}

export function AvailabilityCalendar({ availability, bookings = [], editable = true, showBookings = true }: {
  availability: AvailabilityRule[];
  bookings?: Booking[];
  editable?: boolean;
  showBookings?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
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
  const isPastSelectedDate = selectedDate < today;
  const selectedRules = dayRulesForDate(availability, selectedDate);
  const selectedBookings = bookings.filter(
    (booking) => new Date(booking.start_time).toDateString() === selectedDate.toDateString()
  );
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    for (let offset = 0; offset < 180; offset += 1) {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      const rules = dayRulesForDate(availability, date);
      if (rules.some((rule) => !rule.is_unavailable)) dates.push(date);
    }
    return dates;
  }, [availability, today]);
  const closedDates = useMemo(
    () => availability.filter((rule) => rule.is_unavailable && rule.specific_date).map((rule) => new Date(`${rule.specific_date}T00:00:00`)),
    [availability]
  );
  const bookedDates = useMemo(() => bookings.filter((booking) => ["pending", "confirmed", "in_progress"].includes(booking.status)).map((booking) => new Date(booking.start_time)), [bookings]);
  const label = `${DAY_NAMES[jsDayToBackendDay(selectedDate.getDay())]} ${selectedDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
      <Card className="w-fit">
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            defaultMonth={today}
            fromDate={today}
            toDate={planningEnd}
            disabled={{ before: today, after: planningEnd }}
            numberOfMonths={isDesktop ? 2 : 1}
            modifiers={{ available: availableDates, closed: closedDates, booked: bookedDates }}
            modifiersClassNames={{
              available: "[&>button]:bg-emerald-50 [&>button]:text-emerald-800 dark:[&>button]:bg-emerald-950/40 dark:[&>button]:text-emerald-200",
              closed: "[&>button]:bg-destructive/10 [&>button]:text-destructive",
              booked: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-primary",
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Takvim açıklaması">
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-emerald-500" /> Müsait</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-destructive" /> Kapalı</span>
            <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-primary" /> Rezervasyon</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-semibold"><CalendarIcon className="h-4 w-4 text-primary" /> {label}</p>
              <p className="mt-1 text-sm text-muted-foreground">Bu tarih için müsaitlik ve derslerin.</p>
            </div>
            {editable && !isPastSelectedDate && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-3.5 w-3.5" /> Düzenle</Button>}
          </div>
          {selectedRules.some((rule) => rule.is_unavailable) ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Bu gün kapalı olarak işaretlenmiş.</p>
          ) : selectedRules.length === 0 ? (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Bu gün için müsaitlik tanımlanmamış.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedRules.map((rule) => <span key={rule.id} className="rounded-md border bg-muted/40 px-2 py-1 text-sm tabular-nums">{rule.start_time?.slice(0, 5)}–{rule.end_time?.slice(0, 5)}</span>)}
            </div>
          )}
          {showBookings && selectedBookings.length > 0 && <div className="space-y-2 border-t pt-4"><p className="text-sm font-semibold">Dersler</p>{selectedBookings.map((booking) => <div key={booking.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">{new Date(booking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} · {booking.student.display_name || booking.student.email}</span><StatusBadge status={booking.status} type="booking" /></div>)}</div>}
          {editable && (isPastSelectedDate ? <p className="text-xs text-muted-foreground">Geçmiş tarihler yalnızca görüntülenebilir.</p> : <p className="text-xs text-muted-foreground"><Pencil className="mr-1 inline h-3 w-3" /> Takvimde bir gün seçerek o güne özel saat veya kapalı gün tanımlayabilirsin.</p>)}
        </CardContent>
      </Card>
      {editable && !isPastSelectedDate && <DayAvailabilityDialog open={isEditing} onOpenChange={setIsEditing} dayOfWeek={jsDayToBackendDay(selectedDate.getDay())} date={formatDateLocal(selectedDate)} dayLabel={label} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { CalendarDays, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HorizontalDayPicker } from "@/components/shared/HorizontalDayPicker";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function BookingItem({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <p className="text-[11px] font-semibold tabular-nums">
        {new Date(booking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="truncate text-[11px]">{booking.student.display_name || booking.student.email}</p>
      <p className="truncate text-[10px] text-muted-foreground">{booking.subject.name}</p>
    </div>
  );
}

export function TutorWeeklySchedule({ bookings, onEdit }: { bookings: Booking[]; onEdit: () => void }) {
  const weekStart = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const today = new Date().toDateString();
  const todayIndex = days.findIndex((date) => date.toDateString() === today);
  // Shared selection state for the mobile view; defaults to today when it
  // falls inside the current week (always true here), otherwise Monday.
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex >= 0 ? todayIndex : 0);

  const visibleBookings = bookings.filter((booking) =>
    ["pending", "confirmed", "in_progress"].includes(booking.status)
  );
  const bookingsForDay = (date: Date) =>
    visibleBookings
      .filter((booking) => new Date(booking.start_time).toDateString() === date.toDateString())
      .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));

  const selectedDate = days[selectedDayIndex];
  const selectedDayBookings = bookingsForDay(selectedDate);

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
        <div><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" />Bu Haftaki Programım</CardTitle><p className="mt-1 text-xs text-muted-foreground">Ders programın; müsaitlik saatlerinden bağımsızdır.</p></div>
        <Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="mr-2 h-3.5 w-3.5" />Değiştir</Button>
      </CardHeader>

      {/* Mobile (< md): shared horizontal day picker + selected day's slots */}
      <CardContent className="p-4 pt-0 md:hidden">
        <HorizontalDayPicker
          dates={days}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
          getCount={(date) => bookingsForDay(date).length}
        />
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {selectedDate.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {selectedDayBookings.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground/70">Ders yok</p>
          ) : (
            <div className="space-y-1.5">
              {selectedDayBookings.map((booking) => <BookingItem key={booking.id} booking={booking} />)}
            </div>
          )}
        </div>
      </CardContent>

      {/* md+: 7-column grid. md–lg compresses to fit; lg keeps the min-width + h-scroll. */}
      <CardContent className="hidden overflow-x-auto p-4 pt-0 md:block">
        <div className="grid grid-cols-7 gap-2 lg:min-w-[760px]">
          {days.map((date, index) => {
            const dayBookings = bookingsForDay(date);
            const isToday = date.toDateString() === today;
            return <div key={date.toISOString()} className={cn("min-h-28 rounded-xl border p-2", isToday && "border-primary/50 bg-primary/5")}><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">{DAY_NAMES[index]}</span><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday && "bg-primary text-primary-foreground")}>{date.getDate()}</span></div>{dayBookings.length === 0 ? <p className="pt-3 text-center text-[11px] text-muted-foreground/70">Ders yok</p> : <div className="space-y-1.5">{dayBookings.map((booking) => <BookingItem key={booking.id} booking={booking} />)}</div>}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

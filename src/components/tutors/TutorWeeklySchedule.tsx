"use client";

import { CalendarDays, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function TutorWeeklySchedule({ bookings, onEdit }: { bookings: Booking[]; onEdit: () => void }) {
  const weekStart = startOfWeek(new Date());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const today = new Date().toDateString();
  const visibleBookings = bookings.filter((booking) =>
    ["pending", "confirmed", "in_progress"].includes(booking.status)
  );

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
        <div><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" />Bu Haftaki Programım</CardTitle><p className="mt-1 text-xs text-muted-foreground">Ders programın; müsaitlik saatlerinden bağımsızdır.</p></div>
        <Button variant="ghost" size="sm" onClick={onEdit}><Pencil className="mr-2 h-3.5 w-3.5" />Değiştir</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-4 pt-0">
        <div className="grid min-w-[760px] grid-cols-7 gap-2">
          {days.map((date, index) => {
            const dayBookings = visibleBookings.filter((booking) => new Date(booking.start_time).toDateString() === date.toDateString()).sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));
            const isToday = date.toDateString() === today;
            return <div key={date.toISOString()} className={cn("min-h-28 rounded-xl border p-2", isToday && "border-primary/50 bg-primary/5")}><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold">{DAY_NAMES[index]}</span><span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday && "bg-primary text-primary-foreground")}>{date.getDate()}</span></div>{dayBookings.length === 0 ? <p className="pt-3 text-center text-[11px] text-muted-foreground/70">Ders yok</p> : <div className="space-y-1.5">{dayBookings.map((booking) => <div key={booking.id} className="rounded-lg bg-muted/60 p-2"><p className="text-[11px] font-semibold tabular-nums">{new Date(booking.start_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p><p className="truncate text-[11px]">{booking.student.display_name || booking.student.email}</p><p className="truncate text-[10px] text-muted-foreground">{booking.subject.name}</p></div>)}</div>}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

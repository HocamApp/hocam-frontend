"use client";

import { useEffect, useRef } from "react";
import { longDayLabel, parseLocalDate, timeToMinutes, WEEKDAY_LABELS } from "@/components/schedule/scheduleDates";
import { calendarEventKey, calendarStatus, eventsForCalendarDay, layoutCalendarEvents, type TutorCalendarAvailability, type TutorCalendarEvent, type TutorCalendarView, type TutorTimeOff } from "@/lib/tutorCalendar";

interface Props {
  dates: string[]; date: string; view: TutorCalendarView; today: string;
  events: TutorCalendarEvent[]; availability: TutorCalendarAvailability[]; timeOff: TutorTimeOff[];
  onEvent: (event: TutorCalendarEvent) => void; onTimeOff: (item: TutorTimeOff) => void; onDay: (date: string) => void;
}
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2";
const eventName = (event: TutorCalendarEvent) => `${event.local_time.slice(0,5)} ${event.student.display_name} · ${event.source === "coaching" ? "Koçluk" : event.subject?.name ?? "Ders"} · ${calendarStatus(event)}`;
const eventClass = (event: TutorCalendarEvent) => event.source === "coaching" ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink";

export function TutorCalendarGrid(props: Props) {
  const { dates, date, view, today, events, availability, timeOff, onEvent, onTimeOff, onDay } = props;
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view === "month" || !scroll.current) return;
    const first = events.length ? Math.min(...events.map(event => timeToMinutes(event.local_time))) : 8 * 60;
    scroll.current.scrollTop = Math.max(0, first - 60) * 1.5;
    // A data refresh must not move the user's scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, view]);
  if (view === "month") return <div className="overflow-x-auto rounded-card border border-line bg-surface" role="region" aria-label="Aylık takvim" tabIndex={0}>
    <div className="grid min-w-[630px] grid-cols-7">{WEEKDAY_LABELS.map(day => <div key={day} className="border-b border-line p-3 text-center text-small font-medium">{day}</div>)}
      {dates.map(day => {
        const dayEvents = eventsForCalendarDay(events, day); const off = timeOff.filter(item => item.local_date === day); const available = availability.filter(item => item.local_date === day);
        const records = [...dayEvents.map(event => ({ key: calendarEventKey(event), label: eventName(event), onClick: () => onEvent(events.find(original => calendarEventKey(original) === calendarEventKey(event)) ?? event) })), ...off.map(item => ({ key: item.id, label: `${item.all_day ? "Tüm gün" : item.start_time?.slice(0,5)} Meşgul`, onClick: () => onTimeOff(item) }))];
        return <section key={day} aria-label={longDayLabel(parseLocalDate(day))} className={`min-h-[160px] min-w-0 border-b border-r border-line p-2 ${day.slice(0,7) !== date.slice(0,7) ? "bg-paper" : ""}`}>
          <button onClick={() => onDay(day)} aria-label={`${longDayLabel(parseLocalDate(day))}, günü aç`} aria-current={day === today ? "date" : undefined} className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-small ${focus} ${day === today ? "bg-ink text-paper" : "hover:bg-paper"}`}>{Number(day.slice(-2))}</button>
          {available.length > 0 && <p className="mb-2 text-[11px] leading-4 text-ink-mid">{available.map(item => `${item.start_time.slice(0,5)}–${item.end_time.slice(0,5)}`).join(", ")} müsait</p>}
          <div className="space-y-1">{records.slice(0,2).map(record => <button key={record.key} onClick={record.onClick} title={record.label} className={`block w-full truncate rounded-input border border-line px-2 py-1 text-left text-[11px] hover:bg-paper ${focus}`}>{record.label}</button>)}{records.length > 2 && <button className={`text-small underline underline-offset-4 ${focus}`} onClick={() => onDay(day)}>+{records.length - 2} kayıt</button>}</div>
        </section>;
      })}
    </div>
  </div>;
  const columns = `3.5rem repeat(${dates.length}, minmax(0, 1fr))`;
  return <div ref={scroll} className={`max-h-[680px] overflow-auto rounded-card border border-line bg-surface ${focus}`} role="region" aria-label={view === "week" ? "Haftalık takvim, tüm saatler" : "Günlük takvim, tüm saatler"} tabIndex={0}>
    <div className={view === "week" ? "min-w-[850px]" : "min-w-0"}>
      <div className="sticky top-0 z-20 grid border-b border-line bg-surface" style={{ gridTemplateColumns: columns }}><div aria-hidden="true" />{dates.map(day => <button key={day} onClick={() => onDay(day)} aria-current={day === today ? "date" : undefined} className={`border-l border-line px-1 py-3 text-small ${focus} ${day === today ? "font-bold underline underline-offset-4" : "font-medium"}`}>{longDayLabel(parseLocalDate(day))}</button>)}</div>
      <div className="grid" style={{ gridTemplateColumns: columns }}>
        <div className="relative h-[2160px] text-[11px] tabular-nums text-ink-mid" aria-hidden="true">{Array.from({length:24}, (_,hour) => <span key={hour} className="absolute right-2" style={{top:hour*90+3}}>{String(hour).padStart(2,"0")}:00</span>)}</div>
        {dates.map(day => <section key={day} aria-label={longDayLabel(parseLocalDate(day))} className="relative h-[2160px] min-w-0 border-l border-line">
          {Array.from({length:24}, (_,hour) => <div key={hour} className="pointer-events-none absolute left-0 right-0 border-t border-line" style={{top:hour*90}} aria-hidden="true" />)}
          {availability.filter(item => item.local_date === day).map((item,index) => <div key={index} title={`Müsait: ${item.start_time.slice(0,5)}–${item.end_time.slice(0,5)}`} aria-label={`Müsait: ${item.start_time.slice(0,5)}–${item.end_time.slice(0,5)}`} className="pointer-events-none absolute inset-x-0 border border-line bg-paper" style={{ top:timeToMinutes(item.start_time)*1.5,height:(timeToMinutes(item.end_time)-timeToMinutes(item.start_time))*1.5 }}><span className="px-1 text-[10px] text-ink-mid">Müsait</span></div>)}
          {timeOff.filter(item => item.local_date === day).map(item => <button key={item.id} onClick={() => onTimeOff(item)} title={item.description || "Kişisel meşguliyet"} className={`absolute inset-x-0 z-[1] overflow-hidden border border-dashed border-ink-mid bg-line/70 p-1 text-left text-[11px] text-ink ${focus}`} style={{top:(item.all_day ? 0 : timeToMinutes(item.start_time!))*1.5,height:(item.all_day ? 1440 : timeToMinutes(item.end_time!) - timeToMinutes(item.start_time!))*1.5}}><span className="sticky top-14 block">{item.all_day ? "Tüm gün · " : `${item.start_time?.slice(0,5)} · `}Meşgul</span><span className="sr-only">{item.description}</span></button>)}
          {layoutCalendarEvents(eventsForCalendarDay(events,day)).map(({event,start,end,column,columns:count}) => <button key={calendarEventKey(event)} onClick={() => onEvent(events.find(original => calendarEventKey(original) === calendarEventKey(event)) ?? event)} title={eventName(event)} aria-label={eventName(event)} className={`absolute z-[2] overflow-hidden rounded-input border px-2 py-1 text-left text-[11px] leading-4 transition-colors duration-[120ms] hover:border-ink ${focus} ${eventClass(event)}`} style={{top:start*1.5,height:(end-start)*1.5,left:`calc(${column/count*100}% + 2px)`,width:`calc(${100/count}% - 4px)`}}><span className="block truncate font-medium">{event.local_time.slice(0,5)} · {event.student.display_name}</span><span className="block truncate">{event.source === "coaching" ? "Koçluk" : event.subject?.name ?? "Ders"}</span><span className="block truncate">{calendarStatus(event)}</span></button>)}
        </section>)}
      </div>
    </div>
  </div>;
}

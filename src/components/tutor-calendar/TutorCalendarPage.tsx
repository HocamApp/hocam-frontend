"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScheduleDailyView } from "@/components/schedule/ScheduleDailyView";
import { ScheduleMonthlyView } from "@/components/schedule/ScheduleMonthlyView";
import { ScheduleWeeklyView } from "@/components/schedule/ScheduleWeeklyView";
import { endTimeLabel, longDayLabel, parseLocalDate, rangeLabel, timeToMinutes, toDateKey } from "@/components/schedule/scheduleDates";
import { calendarEventHref, calendarRange, calendarStatus, calendarViewMap, fetchTutorCalendar, istanbulToday, shiftCalendarDate, validCalendarDate, type TutorCalendarAvailability, type TutorCalendarEvent, type TutorCalendarView, type TutorTimeOff } from "@/lib/tutorCalendar";
import type { ScheduleEvent } from "@/types";
import { TutorCalendarManagement } from "./TutorCalendarManagement";

const views: Array<{value:TutorCalendarView;label:string}> = [{value:"day",label:"Gün"},{value:"week",label:"Hafta"},{value:"month",label:"Ay"}];
const NO_PENDING_EVENTS = new Set<string>();

function tutorScheduleEvents(
  events: TutorCalendarEvent[],
  availability: TutorCalendarAvailability[],
  timeOff: TutorTimeOff[],
): ScheduleEvent[] {
  const common = {
    block_type: null,
    completed: null,
    editable: false,
    room_url: "",
    occurrence_date: null,
    recurrence: null,
    block_title: null,
  } as const;
  return [
    ...events.map((event): ScheduleEvent => ({
      ...common,
      source: event.source,
      id: event.id,
      local_date: event.local_date,
      local_time: event.local_time.slice(0, 5),
      duration_minutes: event.duration_minutes,
      status: event.status,
      subject: event.subject,
      title: `${event.source === "coaching" ? "Koçluk" : event.subject?.name ?? "Ders"} · ${event.student.display_name}`,
    })),
    ...availability.map((slot, index): ScheduleEvent => ({
      ...common,
      source: "availability",
      id: `${slot.local_date}:${slot.start_time}:${slot.end_time}:${index}`,
      local_date: slot.local_date,
      local_time: slot.start_time.slice(0, 5),
      duration_minutes: Math.max(1, timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time)),
      status: "available",
      subject: null,
      title: "Müsait",
    })),
    ...timeOff.map((item): ScheduleEvent => ({
      ...common,
      source: "time_off",
      id: item.id,
      local_date: item.local_date,
      local_time: item.all_day ? "00:00" : item.start_time!.slice(0, 5),
      duration_minutes: item.all_day ? 1440 : Math.max(1, timeToMinutes(item.end_time!) - timeToMinutes(item.start_time!)),
      status: "busy",
      subject: null,
      title: item.description.trim() || "Meşgul",
    })),
  ];
}

export function TutorCalendarPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter(), pathname = usePathname(), params = useSearchParams(), queryClient = useQueryClient();
  const [defaultView,setDefaultView] = useState<TutorCalendarView | null>(null);
  const [selected,setSelected] = useState<TutorCalendarEvent | null>(null);
  const [selectedTimeOff,setSelectedTimeOff] = useState<TutorTimeOff | null>(null);
  const [layers,setLayers] = useState({booking:true,coaching:true,availability:true,timeOff:true,cancelled:false});
  const coachingEnabled = process.env.NEXT_PUBLIC_COACHING_ENABLED === "true";
  useEffect(() => { setDefaultView(window.matchMedia("(max-width: 767px)").matches ? "day" : "week"); }, []);
  const today = istanbulToday();
  const rawDate = params.get("date"), rawView = params.get("view");
  const date = validCalendarDate(rawDate) ? rawDate : today;
  const view = views.some(item => item.value === rawView) ? rawView as TutorCalendarView : defaultView ?? "week";
  const navigate = (nextDate:string,nextView:TutorCalendarView) => {
    const query = new URLSearchParams(params.toString()); query.set("date",nextDate); query.set("view",nextView);
    router.push(`${pathname}?${query.toString()}`,{scroll:false});
  };
  useEffect(() => {
    if (!defaultView || (rawDate === date && rawView === view)) return;
    const query = new URLSearchParams(params.toString()); query.set("date",date); query.set("view",view);
    router.replace(`${pathname}?${query.toString()}`,{scroll:false});
  },[defaultView,rawDate,rawView,date,view,pathname,params,router]);
  const profile = useQuery({queryKey:["tutor-me"],queryFn:fetchMyTutorProfile,enabled:isAuthenticated});
  const range = calendarRange(date,view);
  const calendar = useQuery({queryKey:["tutor-calendar",profile.data?.id ?? user?.id,range.from,range.to],queryFn:() => fetchTutorCalendar(range.from,range.to),enabled:Boolean(defaultView && isAuthenticated && profile.data?.is_verified),refetchInterval:60_000});
  const changed = () => { void queryClient.invalidateQueries({queryKey:["tutor-calendar"]}); void queryClient.invalidateQueries({queryKey:["availability"]}); void queryClient.invalidateQueries({queryKey:["bookings"]}); };
  const visibleEvents = (calendar.data?.events ?? []).filter(event => (event.source === "booking" ? layers.booking : coachingEnabled && layers.coaching) && (layers.cancelled || !["cancelled","expired"].includes(event.status)));
  const visibleAvailability = layers.availability ? calendar.data?.availability ?? [] : [];
  const visibleTimeOff = layers.timeOff ? calendar.data?.time_off ?? [] : [];
  const displayEvents = tutorScheduleEvents(visibleEvents, visibleAvailability, visibleTimeOff);
  const filters: Array<{key:keyof typeof layers;label:string}> = [{key:"booking",label:"Dersler"},...(coachingEnabled ? [{key:"coaching" as const,label:"Koçluk"}] : []),{key:"availability",label:"Müsaitlik"},{key:"timeOff",label:"Meşguliyet"},{key:"cancelled",label:"İptal edilenler"}];
  const error = profile.isError || calendar.isError;
  const loading = !defaultView || profile.isPending || (Boolean(profile.data?.is_verified) && calendar.isPending);
  const hasData = Boolean(calendar.data?.events.length || calendar.data?.availability.length || calendar.data?.time_off.length);
  const selectDisplayEvent = (event: ScheduleEvent) => {
    if (event.source === "time_off") {
      const item = calendar.data?.time_off.find(row => row.id === event.id);
      if (item) setSelectedTimeOff(item);
      return;
    }
    if (event.source !== "booking" && event.source !== "coaching") return;
    const item = calendar.data?.events.find(row => row.source === event.source && row.id === event.id);
    if (item) setSelected(item);
  };
  const selectableDisplayEvent = (event: ScheduleEvent) => event.source !== "availability";
  return <WorkspacePageShell title="Takvim" width="wide">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-small text-ink-mid">Derslerin, koçluk görüşmelerin ve müsait saatlerin. Saat dilimi: İstanbul.</p>{calendar.isSuccess && <TutorCalendarManagement date={date} timeOff={calendar.data.time_off} events={calendar.data.events} onChanged={changed} selectedTimeOff={selectedTimeOff} onTimeOffClose={() => setSelectedTimeOff(null)} />}</div>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><Button variant="outline" onClick={() => navigate(today,view)}>Bugün</Button><Button variant="outline" size="icon" aria-label="Önceki dönem" onClick={() => navigate(shiftCalendarDate(date,view,-1),view)}><CaretLeft className="h-5 w-5" aria-hidden="true" /></Button><Button variant="outline" size="icon" aria-label="Sonraki dönem" onClick={() => navigate(shiftCalendarDate(date,view,1),view)}><CaretRight className="h-5 w-5" aria-hidden="true" /></Button><label className="sr-only" htmlFor="tutor-calendar-date">Takvim tarihi</label><Input id="tutor-calendar-date" type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={event => { if(validCalendarDate(event.target.value)) navigate(event.target.value,view); }} className="w-[155px] min-w-0 rounded-input border-line bg-surface" /></div>
      <div role="group" aria-label="Takvim görünümü" className="flex gap-1">{views.map(item => <Button key={item.value} variant="outline" aria-pressed={view === item.value} onClick={() => navigate(date,item.value)} className={view === item.value ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line"}>{item.label}</Button>)}</div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-h3 font-medium">{rangeLabel(calendarViewMap[view],parseLocalDate(date))}</h2><div role="group" aria-label="Takvim katmanları" className="flex flex-wrap gap-x-4 gap-y-2">{filters.map(filter => <label key={filter.key} className="flex cursor-pointer items-center gap-2 text-small"><input type="checkbox" checked={layers[filter.key]} onChange={event => setLayers(current => ({...current,[filter.key]:event.target.checked}))} className="h-4 w-4 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" />{filter.label}</label>)}</div></div>
    {error ? <div role="alert" className="space-y-3 rounded-card border border-line bg-surface p-6"><p>Takvim yüklenemedi. Saatlerin boş olduğunu varsaymadan yeniden deneyebilirsin.</p><Button variant="outline" onClick={() => { void profile.refetch(); if (profile.data?.is_verified) void calendar.refetch(); }}>Yeniden dene</Button></div> : loading ? <p role="status" className="py-8 text-ink-mid">Takvim yükleniyor…</p> : !profile.data?.is_verified ? <p>Takvimine erişmek için hoca doğrulamanı tamamlamalısın.</p> : calendar.data ? <>
      {!hasData ? <p role="status" className="text-small text-ink-mid">Bu dönemde ders, müsaitlik veya meşguliyet kaydın yok. Müsait saatlerini ekleyebilirsin.</p> : !(visibleEvents.length || visibleAvailability.length || visibleTimeOff.length) ? <p role="status" className="text-small text-ink-mid">Bu dönemin kayıtları seçtiğin filtrelerle gizlendi.</p> : null}
      <section className="rounded-[28px] border border-line bg-surface p-2 shadow-soft sm:p-4" aria-label="Takvim alanı">
        {view === "day" ? <ScheduleDailyView day={parseLocalDate(date)} events={displayEvents} pendingKeys={NO_PENDING_EVENTS} onSelectEvent={selectDisplayEvent} isEventSelectable={selectableDisplayEvent} />
          : view === "week" ? <ScheduleWeeklyView anchor={parseLocalDate(date)} events={displayEvents} pendingKeys={NO_PENDING_EVENTS} onSelectEvent={selectDisplayEvent} isEventSelectable={selectableDisplayEvent} />
          : <ScheduleMonthlyView anchor={parseLocalDate(date)} events={displayEvents} onSelectEvent={selectDisplayEvent} isEventSelectable={selectableDisplayEvent} onSelectDay={day => navigate(toDateKey(day),"day")} />}
      </section>
    </> : null}
    <Dialog open={Boolean(selected)} onOpenChange={open => {if(!open) setSelected(null);}}><DialogContent showClose={false} className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-modal border-line bg-surface text-ink"><DialogClose asChild><Button variant="ghost" size="icon" aria-label="Ders ayrıntısını kapat" className="absolute right-3 top-3"><X className="h-5 w-5" /></Button></DialogClose><DialogTitle className="pr-10 font-medium">{selected?.student.display_name}</DialogTitle><DialogDescription>{selected ? `${selected.source === "coaching" ? "Koçluk görüşmesi" : selected.subject?.name ?? "Ders"} · ${longDayLabel(parseLocalDate(selected.local_date))}` : "Ders ayrıntısı"}</DialogDescription>{selected && <><dl className="space-y-3 text-small"><div><dt className="text-ink-mid">İstanbul saati</dt><dd>{selected.local_time.slice(0,5)} – {endTimeLabel(selected.local_time,selected.duration_minutes)} · {selected.duration_minutes} dakika</dd></div><div><dt className="text-ink-mid">Durum</dt><dd>{calendarStatus(selected)}</dd></div></dl><div className="flex flex-wrap gap-2"><Button asChild><Link href={calendarEventHref(selected)}>{selected.source === "booking" ? "Dersi aç" : "Koçluk programını aç"}</Link></Button>{selected.classroom_available && <Button variant="outline" asChild><Link href={`/dashboard/tutor/classroom/${selected.student.id}`}>Öğrenciyi aç</Link></Button>}</div></>}</DialogContent></Dialog>
  </WorkspacePageShell>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarBlank, Plus } from "@phosphor-icons/react";
import api from "@/lib/api";
import type { TutorCalendarEvent, TutorTimeOff } from "@/lib/tutorCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DayAvailabilityDialog } from "@/components/tutors/DayAvailabilityDialog";

type Props = { date: string; timeOff: TutorTimeOff[]; events: TutorCalendarEvent[]; onChanged: () => void; selectedTimeOff?: TutorTimeOff | null; onTimeOffClose?: () => void };
type Draft = { local_date: string; all_day: boolean; start_time: string; end_time: string; description: string };
const emptyDraft = (date: string): Draft => ({ local_date: date, all_day: false, start_time: "", end_time: "", description: "" });

export function timeOffStarted(row: Pick<TutorTimeOff, "local_date" | "all_day" | "start_time">, now = Date.now()) {
  return new Date(`${row.local_date}T${row.all_day ? "00:00" : (row.start_time || "00:00").slice(0, 5)}:00+03:00`).getTime() <= now;
}

export function TutorCalendarManagement({ date, timeOff, events, onChanged, selectedTimeOff, onTimeOffClose }: Props) {
  const queryClient = useQueryClient();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TutorTimeOff | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(date));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [conflictHref, setConflictHref] = useState("");
  const started = Boolean(editing && timeOffStarted(editing));

  const edit = (row: TutorTimeOff) => {
    setEditing(row);
    setDraft({ ...row, start_time: row.start_time?.slice(0, 5) || "", end_time: row.end_time?.slice(0, 5) || "" });
    setError(""); setConflictHref(""); setOpen(true);
  };
  useEffect(() => { if (selectedTimeOff) edit(selectedTimeOff); }, [selectedTimeOff]);

  const close = () => { if (!pending) { setOpen(false); onTimeOffClose?.(); } };
  const invalidate = async () => {
    await Promise.all(["tutor-calendar", "availability", "tutor-busy-intervals", "tutor-availability", "bookings"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
    onChanged();
  };
  const submit = async (remove = false) => {
    setError(""); setConflictHref("");
    if (!remove) {
      if (!draft.local_date || (!draft.all_day && (!draft.start_time || !draft.end_time || draft.start_time >= draft.end_time))) {
        setError("Tarih ve aynı gün içinde geçerli bir başlangıç/bitiş saati seç."); return;
      }
      if (draft.description.length > 200) { setError("Açıklama en fazla 200 karakter olabilir."); return; }
      if (timeOffStarted(draft)) { setError("Başlamış bir saat için meşguliyet eklenemez veya düzenlenemez."); return; }
    }
    setPending(true);
    try {
      if (remove && editing) await api.delete(`/tutors/me/time-off/${editing.id}/`);
      else {
        const payload = { local_date: draft.local_date, all_day: draft.all_day, start_time: draft.all_day ? null : draft.start_time, end_time: draft.all_day ? null : draft.end_time, description: draft.description };
        if (editing) await api.patch(`/tutors/me/time-off/${editing.id}/`, payload);
        else await api.post("/tutors/me/time-off/", payload);
      }
      await invalidate(); setOpen(false); onTimeOffClose?.();
    } catch (caught) {
      const data = (caught as { response?: { data?: { detail?: string; conflict?: { management_url?: string } } } }).response?.data;
      setError(typeof data?.detail === "string" ? data.detail : "Meşguliyet kaydedilemedi. Bilgilerini koruduk, yeniden deneyebilirsin.");
      const href = data?.conflict?.management_url;
      if (href?.startsWith("/dashboard/") || href?.startsWith("/coaching/")) setConflictHref(href);
    } finally { setPending(false); }
  };

  return <>
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setAvailabilityOpen(true)}><CalendarBlank className="mr-2 size-4" />Müsaitliği düzenle</Button>
      <Button onClick={() => { setEditing(null); setDraft(emptyDraft(date)); setError(""); setConflictHref(""); setOpen(true); }}><Plus className="mr-2 size-4" />Meşguliyet ekle</Button>
    </div>
    <DayAvailabilityDialog open={availabilityOpen} onOpenChange={setAvailabilityOpen} dayOfWeek={(new Date(`${date}T12:00:00`).getDay() + 6) % 7} date={date} dayLabel={new Date(`${date}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} calendarEvents={events} onChanged={onChanged} />
    <Dialog open={open} onOpenChange={(value) => { if (!value) close(); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Meşguliyeti düzenle" : "Meşguliyet ekle"}</DialogTitle><DialogDescription>Yalnızca sana görünür. Bu saatlerde yeni ders ve koçluk planlanamaz. Saatler İstanbul saatidir.</DialogDescription></DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4">
          <fieldset disabled={pending || started} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="time-off-date">Tarih</Label><Input id="time-off-date" type="date" value={draft.local_date} required onChange={(e) => setDraft({ ...draft, local_date: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.all_day} onChange={(e) => setDraft({ ...draft, all_day: e.target.checked })} />Tüm gün</label>
            {!draft.all_day && <div className="grid grid-cols-2 gap-3"><div className="min-w-0 space-y-2"><Label htmlFor="time-off-start">Başlangıç</Label><Input className="min-w-0" id="time-off-start" type="time" required value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} /></div><div className="min-w-0 space-y-2"><Label htmlFor="time-off-end">Bitiş</Label><Input className="min-w-0" id="time-off-end" type="time" required value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} /></div></div>}
            <div className="space-y-2"><Label htmlFor="time-off-description">Özel açıklama (isteğe bağlı)</Label><Textarea id="time-off-description" maxLength={200} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><p className="text-xs text-ink-mid">{draft.description.length}/200</p></div>
          </fieldset>
          {started && <p className="text-sm text-ink-mid">Başlamış meşguliyet düzenlenemez. Gerekiyorsa kaldırabilirsin.</p>}
          {error && <div role="alert" className="space-y-2 text-sm text-error"><p>{error}</p>{conflictHref && <Link className="underline" href={conflictHref}>Çakışan kaydı aç</Link>}</div>}
          <div className="flex flex-wrap justify-end gap-2">
            {editing && <Button type="button" variant="outline" disabled={pending} onClick={() => void submit(true)}>Meşguliyeti kaldır</Button>}
            <Button type="button" variant="outline" disabled={pending} onClick={close}>Vazgeç</Button>
            {!started && <Button type="submit" disabled={pending}>{pending ? "Kaydediliyor…" : "Kaydet"}</Button>}
          </div>
        </form>
        {!editing && timeOff.length > 0 && <div className="space-y-2 border-t border-line pt-4"><p className="text-sm font-medium">Bu dönemdeki meşguliyetler</p>{timeOff.map((row) => <button key={row.id} onClick={() => edit(row)} className="block w-full rounded-input border border-line p-3 text-left text-sm text-ink hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">{row.local_date} · {row.all_day ? "Tüm gün" : `${row.start_time?.slice(0, 5)}–${row.end_time?.slice(0, 5)}`}</button>)}</div>}
      </DialogContent>
    </Dialog>
  </>;
}

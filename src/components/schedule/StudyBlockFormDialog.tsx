"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { TimeSelect } from "@/components/ui/time-select";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { fetchSubjects } from "@/lib/tutorsApi";
import type { ScheduleEvent, StudyBlockPayload, StudyBlockType } from "@/types";
import { STUDY_BLOCK_TYPE_OPTIONS } from "./scheduleTheme";
import { toDateKey } from "./scheduleDates";

const NO_SUBJECT = "__none__";
const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

/** Durations offered, plus the block's own if it is not one of them.
 *
 * A block created outside this form (API, import, a future option list) would
 * otherwise open with an empty Süre field and be saved back at whatever the
 * student's first interaction produced — silently rewriting a value they never
 * touched. Showing the real value keeps the edit honest. */
function durationOptions(current: number): number[] {
  if (DURATION_OPTIONS.includes(current)) return DURATION_OPTIONS;
  return [...DURATION_OPTIONS, current].sort((a, b) => a - b);
}

export interface StudyBlockFormValues extends StudyBlockPayload {}

interface StudyBlockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set when editing; the event carries the occurrence being edited. */
  editing?: ScheduleEvent | null;
  /** Default day when adding from a specific date. */
  defaultDate: Date;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: StudyBlockFormValues) => void;
}

export function StudyBlockFormDialog({
  open,
  onOpenChange,
  editing,
  defaultDate,
  isSubmitting,
  errorMessage,
  onSubmit,
}: StudyBlockFormDialogProps) {
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const [subjectId, setSubjectId] = useState<string>(NO_SUBJECT);
  const [blockType, setBlockType] = useState<StudyBlockType>("soru_cozumu");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(toDateKey(defaultDate));
  const [startTime, setStartTime] = useState("19:30");
  const [duration, setDuration] = useState(60);
  const [repeats, setRepeats] = useState(false);
  // A ref, not the isSubmitting prop: both halves of a double-click run before
  // the parent re-renders with the mutation's pending state, so anything
  // derived from React state still reads false on the second click. The ref
  // flips synchronously inside the first handler.
  const submitting = useRef(false);

  // Re-seed every time the dialog opens so a cancelled edit never leaks into
  // the next "+ Çalışma Ekle".
  useEffect(() => {
    if (!open) return;
    submitting.current = false;
    if (editing) {
      setSubjectId(editing.subject?.id ?? NO_SUBJECT);
      setBlockType(editing.block_type ?? "custom");
      // The student's own note, not the composed display title — seeding from
      // `title` would write "Matematik · Soru Çözümü" back as the note.
      setTitle(editing.block_title ?? "");
      setStartDate(editing.occurrence_date ?? editing.local_date);
      setStartTime(editing.local_time);
      setDuration(editing.duration_minutes);
      setRepeats(editing.recurrence === "weekly");
    } else {
      setSubjectId(NO_SUBJECT);
      setBlockType("soru_cozumu");
      setTitle("");
      setStartDate(toDateKey(defaultDate));
      setStartTime("19:30");
      setDuration(60);
      setRepeats(false);
    }
  }, [open, editing, defaultDate]);

  // Release the latch once the mutation settles. On success the dialog closes;
  // on failure it stays open with an inline error, and the student has to be
  // able to fix the field and submit again.
  useEffect(() => {
    if (!isSubmitting) submitting.current = false;
  }, [isSubmitting]);

  const handleSubmit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    onSubmit({
      subject: subjectId === NO_SUBJECT ? null : subjectId,
      block_type: blockType,
      title: title.trim(),
      start_date: startDate,
      start_time: startTime,
      duration_minutes: duration,
      recurrence: repeats ? "weekly" : "none",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Çalışmayı düzenle" : "Çalışma ekle"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Değişiklik bu tarihten itibaren geçerli olur; geçmiş haftalar olduğu gibi kalır."
              : "Kendi çalışma bloklarını programına ekle."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="study-block-type">Çalışma türü</Label>
            <ResponsiveSelect
              id="study-block-type"
              label="Çalışma türü"
              value={blockType}
              onValueChange={(value) => setBlockType(value as StudyBlockType)}
              options={STUDY_BLOCK_TYPE_OPTIONS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-block-subject">Ders</Label>
            <ResponsiveSelect
              id="study-block-subject"
              label="Ders"
              value={subjectId}
              onValueChange={setSubjectId}
              placeholder="Ders seç"
              options={[
                { value: NO_SUBJECT, label: "Ders seçme (genel çalışma)" },
                ...(subjects ?? []).map((subject) => ({
                  value: subject.id,
                  label: `${subject.name} · ${subject.exam_type}`,
                })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-block-title">Not (isteğe bağlı)</Label>
            <Input
              id="study-block-title"
              value={title}
              maxLength={200}
              placeholder="Örn. Türev tekrar"
              onChange={(inputEvent) => setTitle(inputEvent.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="study-block-date">Tarih</Label>
              <Input
                id="study-block-date"
                type="date"
                required
                value={startDate}
                onChange={(inputEvent) => setStartDate(inputEvent.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="study-block-time">Saat</Label>
              <TimeSelect id="study-block-time" value={startTime} onChange={setStartTime} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-block-duration">Süre</Label>
            <ResponsiveSelect
              id="study-block-duration"
              label="Süre"
              value={String(duration)}
              onValueChange={(value) => setDuration(Number(value))}
              options={durationOptions(duration).map((minutes) => ({
                value: String(minutes),
                label: `${minutes} dakika`,
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-block-repeat">Tekrar</Label>
            <ResponsiveSelect
              id="study-block-repeat"
              label="Tekrar"
              value={repeats ? "weekly" : "none"}
              onValueChange={(value) => setRepeats(value === "weekly")}
              options={[
                { value: "none", label: "Sadece bu hafta" },
                { value: "weekly", label: "Her hafta tekrarla" },
              ]}
            />
          </div>

          {errorMessage && <ErrorMessage message={errorMessage} />}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeSelect } from "@/components/ui/time-select";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { fetchSubjects } from "@/lib/tutorsApi";
import type { ScheduleEvent, StudyBlockPayload, StudyBlockType } from "@/types";
import { STUDY_BLOCK_TYPE_OPTIONS } from "./scheduleTheme";
import { toDateKey } from "./scheduleDates";

const NO_SUBJECT = "__none__";
const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];

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

  // Re-seed every time the dialog opens so a cancelled edit never leaks into
  // the next "+ Çalışma Ekle".
  useEffect(() => {
    if (!open) return;
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

  const handleSubmit = (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
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
            <Select
              value={blockType}
              onValueChange={(value) => setBlockType(value as StudyBlockType)}
            >
              <SelectTrigger id="study-block-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_BLOCK_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-block-subject">Ders</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger id="study-block-subject">
                <SelectValue placeholder="Ders seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUBJECT}>Ders seçme (genel çalışma)</SelectItem>
                {(subjects ?? []).map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} · {subject.exam_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select
              value={String(duration)}
              onValueChange={(value) => setDuration(Number(value))}
            >
              <SelectTrigger id="study-block-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} dakika
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="study-block-repeat">Tekrar</Label>
            <Select
              value={repeats ? "weekly" : "none"}
              onValueChange={(value) => setRepeats(value === "weekly")}
            >
              <SelectTrigger id="study-block-repeat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sadece bu hafta</SelectItem>
                <SelectItem value="weekly">Her hafta tekrarla</SelectItem>
              </SelectContent>
            </Select>
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

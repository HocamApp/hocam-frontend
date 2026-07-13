"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import type { ExamType, Subject } from "@/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const YKS_EXAMS: ExamType[] = ["TYT", "AYT", "YDT"];
const OTHER_EXAMS: ExamType[] = ["DGS", "KPSS"];

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  onToggle: (id: string) => void;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function SubjectSelector({
  subjects,
  selectedIds,
  loading,
  error,
  onToggle,
}: SubjectSelectorProps) {
  const availableExams = useMemo(
    () => [...YKS_EXAMS, ...OTHER_EXAMS].filter((exam) =>
      subjects.some((subject) => subject.exam_type === exam)
    ),
    [subjects]
  );
  const [activeExam, setActiveExam] = useState<ExamType>(availableExams[0] ?? "TYT");
  const [search, setSearch] = useState("");
  const effectiveExam = availableExams.includes(activeExam)
    ? activeExam
    : (availableExams[0] ?? "TYT");

  const visibleSubjects = subjects.filter(
    (subject) =>
      subject.exam_type === effectiveExam &&
      (!search || normalize(subject.name).includes(normalize(search)))
  );
  const selectedSubjects = subjects.filter((subject) => selectedIds.includes(subject.id));

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Dersler yükleniyor">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Sınav alanı</p>
            <p className="text-sm text-muted-foreground">
              Aynı ders farklı sınavlarda ayrı seçim olarak kaydedilir.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
            {selectedIds.length} ders seçildi
          </span>
        </div>

        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold">YKS</span>
            {YKS_EXAMS.filter((exam) => availableExams.includes(exam)).map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => setActiveExam(exam)}
                aria-pressed={effectiveExam === exam}
                className={cn(
                  "min-h-10 rounded-md border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  effectiveExam === exam
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                )}
              >
                {exam}
              </button>
            ))}
          </div>
          {OTHER_EXAMS.some((exam) => availableExams.includes(exam)) && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="mr-1 text-sm font-semibold">Diğer sınavlar</span>
              {OTHER_EXAMS.filter((exam) => availableExams.includes(exam)).map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setActiveExam(exam)}
                  aria-pressed={effectiveExam === exam}
                  className={cn(
                    "min-h-10 rounded-md border px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    effectiveExam === exam
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  {exam}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="relative block">
          <span className="sr-only">Ders ara</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`${effectiveExam} derslerinde ara`}
            className="pl-9"
          />
        </label>

        <div className="flex min-h-12 flex-wrap gap-2" aria-label={`${effectiveExam} dersleri`}>
          {visibleSubjects.map((subject) => {
            const selected = selectedIds.includes(subject.id);
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onToggle(subject.id)}
                aria-pressed={selected}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                )}
              >
                {selected && <Check className="h-4 w-4" aria-hidden />}
                {subject.name}
              </button>
            );
          })}
          {visibleSubjects.length === 0 && (
            <p className="py-3 text-sm text-muted-foreground">
              Bu aramayla eşleşen ders bulunamadı.
            </p>
          )}
        </div>
        {error && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="border-t pt-5">
        <p className="text-sm font-semibold">Seçtiğin dersler</p>
        {selectedSubjects.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSubjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => onToggle(subject.id)}
                aria-label={`${subject.name} · ${subject.exam_type} dersini kaldır`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm outline-none transition-colors hover:border-destructive/40 hover:bg-destructive/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span>{subject.name} · {subject.exam_type}</span>
                <X className="h-4 w-4 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Henüz ders seçmedin.
          </p>
        )}
      </div>
    </div>
  );
}

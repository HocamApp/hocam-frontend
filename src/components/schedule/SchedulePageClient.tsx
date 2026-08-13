"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import {
  createStudyBlock,
  deleteStudyBlock,
  endStudyBlockSeries,
  fetchScheduleCalendar,
  fetchScheduleProgress,
  getScheduleErrorMessage,
  setOccurrenceCompleted,
  skipStudyBlockOccurrence,
  updateStudyBlock,
} from "@/lib/scheduleApi";
import type { ScheduleEvent, StudyBlockPayload } from "@/types";
import { DeleteStudyBlockDialog, type DeleteScope } from "./DeleteStudyBlockDialog";
import { ScheduleDailyView } from "./ScheduleDailyView";
import { ScheduleEventDetailDialog } from "./ScheduleEventDetailDialog";
import { ScheduleMonthlyView } from "./ScheduleMonthlyView";
import { ScheduleSubjectTotals } from "./ScheduleSubjectTotals";
import { ScheduleSummaryBar } from "./ScheduleSummaryBar";
import { ScheduleWeeklyView } from "./ScheduleWeeklyView";
import { StudyBlockFormDialog } from "./StudyBlockFormDialog";
import {
  rangeForView,
  rangeLabel,
  shiftAnchor,
  startOfWeek,
  toDateKey,
  type ScheduleView,
} from "./scheduleDates";

const VIEW_TABS: { value: ScheduleView; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

/** Identity of one calendar row: a series shows up once per occurrence. */
function eventKey(event: ScheduleEvent): string {
  return `${event.source}-${event.id}-${event.occurrence_date ?? event.local_date}`;
}

function todayLocal(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function SchedulePageClient() {
  const queryClient = useQueryClient();

  const [view, setView] = useState<ScheduleView>("weekly");
  const [anchor, setAnchor] = useState<Date>(todayLocal);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [deleting, setDeleting] = useState<ScheduleEvent | null>(null);
  // The open detail dialog is addressed by key, not by a snapshot: ticking the
  // checkbox refetches the calendar, and a stored copy would keep showing the
  // state from before the tick.
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const range = useMemo(() => rangeForView(view, anchor), [view, anchor]);
  const weekKey = useMemo(() => toDateKey(startOfWeek(anchor)), [anchor]);

  const calendarQuery = useQuery({
    queryKey: ["schedule-calendar", range.from, range.to],
    queryFn: () => fetchScheduleCalendar(range.from, range.to),
  });

  const progressQuery = useQuery({
    queryKey: ["schedule-progress", weekKey],
    queryFn: () => fetchScheduleProgress(weekKey),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["schedule-calendar"] });
    queryClient.invalidateQueries({ queryKey: ["schedule-progress"] });
  };

  const markPending = (id: string, pending: boolean) => {
    setPendingIds((previous) => {
      const next = new Set(previous);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleMutation = useMutation({
    mutationFn: ({
      event,
      completed,
    }: {
      event: ScheduleEvent;
      completed: boolean;
    }) =>
      setOccurrenceCompleted(
        event.id,
        event.occurrence_date ?? event.local_date,
        completed
      ),
    onMutate: ({ event }) => markPending(event.id, true),
    onSuccess: () => refresh(),
    onError: (error) =>
      toast.error(
        getScheduleErrorMessage(error, "Çalışma güncellenemedi. Lütfen tekrar dene.")
      ),
    onSettled: (_data, _error, variables) => markPending(variables.event.id, false),
  });

  const saveMutation = useMutation({
    mutationFn: (values: StudyBlockPayload) => {
      if (!editing) return createStudyBlock(values);
      // A running weekly series is split rather than mutated, and the split
      // takes effect from the occurrence the student opened — that is the
      // date they were looking at when they pressed edit.
      const effectiveDate =
        editing.recurrence === "weekly"
          ? editing.occurrence_date ?? editing.local_date
          : undefined;
      return updateStudyBlock(editing.id, values, effectiveDate);
    },
    onSuccess: () => {
      toast.success(editing ? "Çalışma güncellendi." : "Çalışma programına eklendi.");
      setFormOpen(false);
      setEditing(null);
      setFormError(null);
      refresh();
    },
    onError: (error) =>
      setFormError(getScheduleErrorMessage(error, "Çalışma kaydedilemedi.")),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ event, scope }: { event: ScheduleEvent; scope: DeleteScope }) => {
      const occurrenceDate = event.occurrence_date ?? event.local_date;
      if (scope === "single") return deleteStudyBlock(event.id);
      if (scope === "this_occurrence")
        return skipStudyBlockOccurrence(event.id, occurrenceDate);
      return endStudyBlockSeries(event.id, occurrenceDate);
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.scope === "this_occurrence"
          ? "Bu haftaki çalışma kaldırıldı."
          : "Çalışma silindi."
      );
      setDeleting(null);
      setDeleteError(null);
      refresh();
    },
    onError: (error) =>
      setDeleteError(getScheduleErrorMessage(error, "Çalışma silinemedi.")),
  });

  const events = useMemo(
    () => calendarQuery.data?.events ?? [],
    [calendarQuery.data]
  );

  const detail = useMemo(
    () => events.find((event) => eventKey(event) === detailKey) ?? null,
    [events, detailKey]
  );

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (event: ScheduleEvent) => {
    setEditing(event);
    setFormError(null);
    setFormOpen(true);
  };

  const openDelete = (event: ScheduleEvent) => {
    setDeleteError(null);
    setDeleting(event);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Çalışma Programım</h1>
            <p className="text-sm text-muted-foreground">
              Derslerin, koçluk görüşmelerin ve kendi çalışmaların tek takvimde.
            </p>
          </div>
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Çalışma Ekle
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex rounded-full border border-border bg-card p-1"
            role="tablist"
            aria-label="Takvim görünümü"
          >
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={view === tab.value}
                onClick={() => setView(tab.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  view === tab.value
                    ? "bg-brand-500 text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Önceki"
              onClick={() => setAnchor(shiftAnchor(view, anchor, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[10rem] text-center text-sm font-medium tabular-nums">
              {rangeLabel(view, anchor)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sonraki"
              onClick={() => setAnchor(shiftAnchor(view, anchor, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAnchor(todayLocal())}>
              Bugün
            </Button>
          </div>
        </div>
      </header>

      <ScheduleSummaryBar
        completion={progressQuery.data?.weekly_completion}
        isLoading={progressQuery.isLoading}
      />

      <section className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        {calendarQuery.isLoading ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : calendarQuery.isError ? (
          <ErrorMessage message="Takvim yüklenemedi. Lütfen sayfayı yenile." />
        ) : view === "daily" ? (
          <ScheduleDailyView
            day={anchor}
            events={events}
            pendingIds={pendingIds}
            onToggleCompleted={(event, completed) =>
              toggleMutation.mutate({ event, completed })
            }
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ) : view === "weekly" ? (
          <ScheduleWeeklyView
            anchor={anchor}
            events={events}
            pendingIds={pendingIds}
            onToggleCompleted={(event, completed) =>
              toggleMutation.mutate({ event, completed })
            }
            onEdit={openEdit}
            onDelete={openDelete}
          />
        ) : (
          <ScheduleMonthlyView
            anchor={anchor}
            events={events}
            onSelectEvent={(event) => setDetailKey(eventKey(event))}
            onSelectDay={(day) => {
              setAnchor(day);
              setView("daily");
            }}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Derslere göre çalışma</h2>
        <ScheduleSubjectTotals
          stats={progressQuery.data?.subject_stats}
          isLoading={progressQuery.isLoading}
        />
      </section>

      <StudyBlockFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditing(null);
            setFormError(null);
          }
        }}
        editing={editing}
        defaultDate={anchor}
        isSubmitting={saveMutation.isPending}
        errorMessage={formError}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <DeleteStudyBlockDialog
        event={deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
        isSubmitting={deleteMutation.isPending}
        errorMessage={deleteError}
        onConfirm={(event, scope) => deleteMutation.mutate({ event, scope })}
      />

      <ScheduleEventDetailDialog
        event={detail}
        onOpenChange={(open) => {
          if (!open) setDetailKey(null);
        }}
        pendingIds={pendingIds}
        onToggleCompleted={(event, completed) =>
          toggleMutation.mutate({ event, completed })
        }
        onEdit={openEdit}
        onDelete={openDelete}
      />
    </div>
  );
}

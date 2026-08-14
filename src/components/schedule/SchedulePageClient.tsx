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
import { eventKey } from "./eventIdentity";
import { ScheduleDailyView } from "./ScheduleDailyView";
import { ScheduleEventDetailDialog } from "./ScheduleEventDetailDialog";
import { ScheduleMonthlyView } from "./ScheduleMonthlyView";
import { ScheduleSubjectTotals } from "./ScheduleSubjectTotals";
import { ScheduleSummaryBar } from "./ScheduleSummaryBar";
import { ScheduleWeeklyView } from "./ScheduleWeeklyView";
import { StudyBlockFormDialog } from "./StudyBlockFormDialog";
import {
  parseLocalDate,
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

  // Keyed by occurrence, not by block: every week of a weekly series shares
  // one block id, so keying on that dimmed the whole series while a single
  // checkbox was in flight.
  const markPending = (key: string, pending: boolean) => {
    setPendingIds((previous) => {
      const next = new Set(previous);
      if (pending) next.add(key);
      else next.delete(key);
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
    onMutate: ({ event }) => markPending(eventKey(event), true),
    onSuccess: () => refresh(),
    onError: (error) =>
      toast.error(
        getScheduleErrorMessage(error, "Çalışma güncellenemedi. Lütfen tekrar dene.")
      ),
    onSettled: (_data, _error, variables) =>
      markPending(eventKey(variables.event), false),
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

  /** Switching view keeps the anchor, which after paging through months lands
   * on the 1st rather than the week the student is actually in. Re-anchor to
   * today whenever the target view's range would not contain it. */
  const changeView = (next: ScheduleView) => {
    const { from, to } = rangeForView(next, anchor);
    const today = toDateKey(todayLocal());
    setAnchor(from <= today && today <= to ? anchor : todayLocal());
    setView(next);
  };

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
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Plain buttons rather than a tablist: the ARIA tabs pattern also
              requires a linked tabpanel and arrow-key navigation, and half of
              it announces a contract the widget does not honour. aria-pressed
              says the same thing honestly for a third of the code. */}
          <div
            className="inline-flex rounded-full border border-border bg-card p-1"
            role="group"
            aria-label="Takvim görünümü"
          >
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={view === tab.value}
                onClick={() => changeView(tab.value)}
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
            {/* Sits with the range controls rather than up by the title: this
                is the row the student is already working in. */}
            <Button onClick={openCreate} className="ml-1 shrink-0">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Çalışma Ekle
            </Button>
          </div>
        </div>
      </header>

      <ScheduleSummaryBar
        completion={progressQuery.data?.weekly_completion}
        weekLabel={
          progressQuery.data
            ? rangeLabel("weekly", parseLocalDate(progressQuery.data.week_start))
            : undefined
        }
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
            pendingKeys={pendingIds}
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
            pendingKeys={pendingIds}
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
              // An explicit day pick is its own anchor; changeView would
              // second-guess it back to today.
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
        pendingKeys={pendingIds}
        onToggleCompleted={(event, completed) =>
          toggleMutation.mutate({ event, completed })
        }
        onEdit={openEdit}
        onDelete={openDelete}
      />
    </div>
  );
}

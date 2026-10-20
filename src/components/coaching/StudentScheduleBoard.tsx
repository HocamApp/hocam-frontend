"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { ScheduleTimeRequests } from "@/components/coaching/ScheduleTimeRequests";
import { StudentSchedulePicker } from "@/components/coaching/StudentSchedulePicker";
import { StudentScheduleSummary } from "@/components/coaching/StudentScheduleSummary";
import { InlineError } from "@/components/shared/InlineError";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerNow } from "@/hooks/useServerNow";
import {
  coachingFrequencyLabel,
  confirmCoachingRecurringSlots,
  extractCoachingErrorMessage,
  fetchCoachingSchedulingSlots,
  type CoachingSchedulingState,
} from "@/lib/coachingApi";
import {
  buildScheduleSummary,
  scheduleDeadline,
  toggleScheduleSlot,
  type PickedScheduleSlot,
} from "@/lib/coachingStudentSchedule";

/**
 * The hours the tutor has open, what the student has picked, the server's
 * deadline, and the card for asking the tutor when nothing fits. Frequency and
 * the 30-minute length come from the tutor's plan, never from anything the
 * student can edit.
 */
export function StudentScheduleBoard({ state }: { state: CoachingSchedulingState }) {
  const queryClient = useQueryClient();
  const now = useServerNow();
  const [selected, setSelected] = useState<PickedScheduleSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const slotsQuery = useQuery({
    queryKey: ["coaching-scheduling-slots"],
    queryFn: fetchCoachingSchedulingSlots,
    refetchInterval: 30_000,
  });

  const confirm = useMutation({
    mutationFn: (slots: PickedScheduleSlot[]) => confirmCoachingRecurringSlots(slots),
    onSuccess: () => {
      setError(null);
      toast.success("Koçluk saatlerin onaylandı.");
      queryClient.invalidateQueries({ queryKey: ["coaching-scheduling-state"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-my-recurring-slots"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  const locked = useMemo(() => slotsQuery.data?.accepted_proposals ?? {}, [slotsQuery.data]);
  // An hour the student accepted from the tutor fixes its slot; a pick made for that slot before no longer counts.
  const picks = useMemo(() => selected.filter((slot) => !(slot.slot_index in locked)), [selected, locked]);
  const requiredCount = state.required_slot_count;
  const summary = useMemo(
    () => buildScheduleSummary({ requiredCount, selected: picks, locked }),
    [requiredCount, picks, locked],
  );
  const deadline = scheduleDeadline({ deadlineAt: state.slot_selection_deadline_at, now });
  const lockedIndexes = Object.keys(locked).map(Number);
  const selectedIndexes = picks.map((slot) => slot.slot_index);

  if (slotsQuery.isLoading) {
    return <Skeleton className="h-72 rounded-card" aria-label="Saatler yükleniyor" />;
  }

  if (slotsQuery.isError && !slotsQuery.data) {
    return (
      <CoachingLoadError
        message="Hocanın açık saatleri yüklenemedi."
        onRetry={() => slotsQuery.refetch()}
        isRetrying={slotsQuery.isFetching}
      />
    );
  }

  const submit = () => {
    const fixed: PickedScheduleSlot[] = Object.entries(locked).map(([index, hour]) => ({
      slot_index: Number(index),
      day_of_week: hour.day_of_week,
      start_time: hour.start_time,
    }));
    confirm.mutate([...picks, ...fixed]);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <StudentSchedulePicker
          slots={slotsQuery.data?.availability_slots ?? []}
          locked={locked}
          selected={picks}
          canPickMore={picks.length + lockedIndexes.length < requiredCount}
          onToggle={(day, time) => {
            setError(null);
            setSelected((current) =>
              toggleScheduleSlot({
                requiredCount,
                locked,
                selected: current.filter((slot) => !(slot.slot_index in locked)),
                day,
                time,
              }),
            );
          }}
        />
        <div className="space-y-3">
          <StudentScheduleSummary
            planLine={`${coachingFrequencyLabel(state.frequency)} · 30 dakika · ${state.total_sessions} görüşme`}
            deadline={deadline}
            summary={summary}
            requiredCount={requiredCount}
            isSubmitting={confirm.isPending}
            onSubmit={submit}
          />
          <InlineError message={error} />
        </div>
      </div>

      <ScheduleTimeRequests
        requiredCount={requiredCount}
        lockedIndexes={lockedIndexes}
        selectedIndexes={selectedIndexes}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SchedulingDeadlineBanner } from "@/components/coaching/SchedulingDeadlineBanner";
import { RecurringSlotPicker, type PickedSlot } from "@/components/coaching/RecurringSlotPicker";
import { TimeRequestPanel } from "@/components/coaching/TimeRequestPanel";
import { CoachingSessionList } from "@/components/coaching/CoachingSessionList";
import { RecurringSlotChangeDialog } from "@/components/coaching/RecurringSlotChangeDialog";
import {
  COACHING_DAY_LABEL,
  coachingFrequencyLabel,
  confirmCoachingRecurringSlots,
  extractCoachingErrorMessage,
  fetchCoachingSchedulingSlots,
  fetchCoachingSchedulingState,
  fetchMyCoachingRecurringSlots,
} from "@/lib/coachingApi";

/**
 * Faz 4: the student's recurring-slot selection screen.
 *
 * Frequency and the 30-minute session length are always read-only here —
 * they come from the tutor's plan (`CoachingSchedulingState`), never from
 * anything the student can edit. The deadline shown is always the
 * server's `slot_selection_deadline_at`, never a client-computed "7 days
 * from now".
 */
function ScheduleContent() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PickedSlot[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: state, isLoading: stateLoading } = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });

  const isAwaitingSchedule = state?.service_status === "accepted_awaiting_schedule";

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["coaching-scheduling-slots"],
    queryFn: fetchCoachingSchedulingSlots,
    enabled: isAwaitingSchedule,
    refetchInterval: 30_000,
  });

  const confirm = useMutation({
    mutationFn: (slots: PickedSlot[]) => confirmCoachingRecurringSlots(slots),
    onSuccess: () => {
      setError(null);
      toast.success("Koçluk saatlerin onaylandı.");
      queryClient.invalidateQueries({ queryKey: ["coaching-scheduling-state"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-sessions"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  if (stateLoading) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!state) {
    return (
      <EmptyState
        title="Şu anda planlanacak bir koçluğun yok"
        description="Ders paketi ve koçluk bundle talebin öğretmenin tarafından kabul edilip hizmetin aktive olduğunda burada saat seçebilirsin."
      />
    );
  }

  if (state.service_status === "active") {
    return <ActiveScheduleView />;
  }

  if (state.service_status === "cancellation_pending" || state.service_status === "cancelled") {
    return (
      <EmptyState
        title="Saat seçme süresi doldu"
        description="Bu koçluk için ortak bir saat bulunamadı; koçluk iptal edildi. Ders paketin bu durumdan etkilenmedi."
      />
    );
  }

  if (!isAwaitingSchedule) {
    return (
      <EmptyState
        title="Şu anda saat seçemezsin"
        description={`Koçluk durumu: ${state.service_status}`}
      />
    );
  }

  const lockedSlots = slotsData?.accepted_proposals ?? {};
  const readyCount = selected.length + Object.keys(lockedSlots).length;
  const canSubmit = readyCount === state.required_slot_count;

  const submit = () => {
    const lockedAsPicked: PickedSlot[] = Object.entries(lockedSlots).map(
      ([index, slot]) => ({
        slot_index: Number(index),
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
      })
    );
    confirm.mutate([...selected, ...lockedAsPicked]);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{coachingFrequencyLabel(state.frequency)}</Badge>
          <Badge variant="secondary">30 dakika</Badge>
          <Badge variant="secondary">{state.total_sessions} görüşme</Badge>
        </div>
      </div>

      <SchedulingDeadlineBanner deadlineAt={state.slot_selection_deadline_at} />

      {error ? <ErrorMessage message={error} /> : null}

      {slotsLoading ? (
        <div className="flex min-h-[12rem] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <RecurringSlotPicker
                requiredCount={state.required_slot_count}
                availableSlots={slotsData?.availability_slots ?? []}
                lockedSlots={lockedSlots}
                selected={selected}
                onChange={setSelected}
              />
            </CardContent>
          </Card>

          {Array.from({ length: state.required_slot_count }, (_, i) => i)
            .filter((i) => !(i in lockedSlots))
            .map((i) => <TimeRequestPanel key={i} slotIndex={i} />)}

          <Button
            className="w-full sm:w-auto"
            disabled={!canSubmit || confirm.isPending}
            onClick={submit}
          >
            {confirm.isPending ? "Onaylanıyor..." : "Saatleri Onayla"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Saatler Türkiye saatidir (Europe/Istanbul).
          </p>
        </>
      )}
    </div>
  );
}

/**
 * Once scheduling is done, this route stays the single reachable screen
 * for reschedule/recurring-change until Faz 5 opens the full
 * `/dashboard/student/coaching` workspace.
 */
function ActiveScheduleView() {
  const { data } = useQuery({
    queryKey: ["coaching-my-recurring-slots"],
    queryFn: fetchMyCoachingRecurringSlots,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Koçluk Görüşmelerim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Koçluğun planlandı. Görüşmelerini aşağıda görebilir, gerekirse yeniden
          planlayabilirsin.
        </p>
      </div>

      {data?.recurring_slots && data.recurring_slots.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm font-medium">Düzenli saatlerin</p>
            {data.recurring_slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <p className="text-sm">
                  {COACHING_DAY_LABEL[slot.day_of_week]} {slot.start_time.slice(0, 5)}
                  {slot.source === "tutor_proposal" ? (
                    <Badge variant="secondary" className="ml-2">
                      Özel saat
                    </Badge>
                  ) : null}
                </p>
                {data.purchase_id ? (
                  <RecurringSlotChangeDialog
                    purchaseId={data.purchase_id}
                    slotIndex={slot.slot_index}
                    currentDayOfWeek={slot.day_of_week}
                    currentStartTime={slot.start_time}
                  />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <CoachingSessionList />
    </div>
  );
}

export default function CoachingSchedulePage() {
  return (
    <RouteGuard requireRole="student">
      <CoachingPageShell title="Koçluk saatlerim" description="Öğretmenin ayrı koçluk müsaitliğinden düzenli görüşme saatlerini seç veya mevcut saat değişikliklerini yönet." parentHref="/dashboard/student/coaching" parentLabel="Çalışma koçluğum" eyebrow="Planlama" width="narrow"><ScheduleContent /></CoachingPageShell>
    </RouteGuard>
  );
}

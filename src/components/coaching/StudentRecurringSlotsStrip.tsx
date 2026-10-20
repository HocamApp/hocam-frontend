"use client";

import { useQuery } from "@tanstack/react-query";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { RecurringSlotChangeDialog } from "@/components/coaching/RecurringSlotChangeDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { COACHING_DAY_LABEL, fetchMyCoachingRecurringSlots } from "@/lib/coachingApi";

/**
 * "Düzenli saatlerin": the weekly hours of the running coaching, each with its
 * own way to change it. It sits above the meetings because it is where the
 * student already is, instead of a page nothing linked to. Shown only while a
 * coaching is running and has hours; a failed read says so rather than
 * vanishing, since a missing strip would look like having no regular hours.
 */
export function StudentRecurringSlotsStrip() {
  const query = useQuery({
    queryKey: ["coaching-my-recurring-slots"],
    queryFn: fetchMyCoachingRecurringSlots,
  });

  if (query.isLoading) return <Skeleton className="h-28 rounded-card" aria-hidden="true" />;

  if (query.isError) {
    return (
      <CoachingLoadError
        message="Düzenli saatlerin yüklenemedi."
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  const data = query.data;
  if (!data?.purchase_id || data.recurring_slots.length === 0) return null;
  const purchaseId = data.purchase_id;

  return (
    <section aria-label="Düzenli saatlerin" className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-body font-medium text-ink">Düzenli saatlerin</h2>
      <ul className="mt-2 divide-y divide-line">
        {data.recurring_slots.map((slot) => {
          const hour = slot.start_time.slice(0, 5);
          return (
            <li key={slot.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <div className="min-w-0">
                <p className="text-small text-ink-mid">
                  {slot.source === "tutor_proposal"
                    ? `${slot.slot_index + 1}. saat · hocanın önerdiği özel saat`
                    : `${slot.slot_index + 1}. saat`}
                </p>
                <p className="text-body font-medium tabular-nums text-ink">
                  {`${COACHING_DAY_LABEL[slot.day_of_week] ?? ""} ${hour}`}
                </p>
              </div>
              <RecurringSlotChangeDialog
                purchaseId={purchaseId}
                slotIndex={slot.slot_index}
                currentDayOfWeek={slot.day_of_week}
                currentStartTime={slot.start_time}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

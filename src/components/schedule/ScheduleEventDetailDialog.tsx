"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ScheduleEvent } from "@/types";
import { ScheduleEventCard } from "./ScheduleEventCard";
import { longDayLabel, parseLocalDate } from "./scheduleDates";

interface ScheduleEventDetailDialogProps {
  event: ScheduleEvent | null;
  onOpenChange: (open: boolean) => void;
  pendingIds: Set<string>;
  onToggleCompleted: (event: ScheduleEvent, completed: boolean) => void;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (event: ScheduleEvent) => void;
}

/**
 * A month cell is too small for a checkbox and two buttons, so tapping a chip
 * opens the same card the day and week views show, with the same actions.
 */
export function ScheduleEventDetailDialog({
  event,
  onOpenChange,
  pendingIds,
  onToggleCompleted,
  onEdit,
  onDelete,
}: ScheduleEventDetailDialogProps) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {event ? longDayLabel(parseLocalDate(event.local_date)) : ""}
          </DialogTitle>
        </DialogHeader>
        {event && (
          <ScheduleEventCard
            event={event}
            pending={pendingIds.has(event.id)}
            onToggleCompleted={onToggleCompleted}
            onEdit={(target) => {
              onOpenChange(false);
              onEdit(target);
            }}
            onDelete={(target) => {
              onOpenChange(false);
              onDelete(target);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

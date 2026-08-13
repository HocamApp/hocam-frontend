"use client";

import { CalendarX, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import type { ScheduleEvent } from "@/types";
import { longDayLabel, parseLocalDate } from "./scheduleDates";

export type DeleteScope = "single" | "this_occurrence" | "series";

interface DeleteStudyBlockDialogProps {
  event: ScheduleEvent | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (event: ScheduleEvent, scope: DeleteScope) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

/**
 * Deleting a repeating block is two different actions and the student has to
 * pick: dropping this one week keeps the series running, ending the series
 * stops it from today on while every past week stays exactly as it was. A
 * one-off block has no such choice, so it doesn't get asked.
 */
export function DeleteStudyBlockDialog({
  event,
  onOpenChange,
  onConfirm,
  isSubmitting,
  errorMessage,
}: DeleteStudyBlockDialogProps) {
  const open = event !== null;
  const isSeries = event?.recurrence === "weekly";
  const occurrenceLabel = event?.occurrence_date
    ? longDayLabel(parseLocalDate(event.occurrence_date))
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Çalışmayı sil</DialogTitle>
          <DialogDescription>
            {isSeries
              ? `“${event?.title}” her hafta tekrarlıyor. Neyi silmek istiyorsun?`
              : `“${event?.title}” programından kaldırılacak.`}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && <ErrorMessage message={errorMessage} />}

        {isSeries ? (
          <div className="space-y-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => event && onConfirm(event, "this_occurrence")}
              className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-60 dark:hover:bg-brand-900/20"
            >
              <CalendarX className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
              <span>
                <span className="block text-sm font-medium">Sadece bu hafta</span>
                <span className="block text-xs text-muted-foreground">
                  {occurrenceLabel} günündeki çalışma kaldırılır, seri devam eder.
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => event && onConfirm(event, "series")}
              className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-destructive/50 hover:bg-destructive/5 disabled:opacity-60"
            >
              <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
              <span>
                <span className="block text-sm font-medium">Tüm seriyi bitir</span>
                <span className="block text-xs text-muted-foreground">
                  Bugünden itibaren tekrarlamaz. Geçmiş haftalar programında kalır.
                </span>
              </span>
            </button>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Vazgeç
          </Button>
          {!isSeries && (
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() => event && onConfirm(event, "single")}
            >
              {isSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

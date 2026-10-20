"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  COACHING_FAZ6_QUERY_KEYS,
  extractCoachingErrorMessage,
  toggleCoachingProgramTaskCompletion,
} from "@/lib/coachingApi";

/** How long the "Geri al" on a completed task stays on screen. */
const UNDO_MS = 6000;

/**
 * Completing a program task, and taking it back. The server endpoint is a
 * toggle, so "Geri al" is simply the same call again; the toast it sits in is
 * short because the task on screen may be stale after that.
 *
 * The program list is refreshed before the mutation counts as finished, so the
 * row's button stays off until then: a second press on a stale row would toggle
 * the task straight back.
 */
export function useProgramTaskToggle(servicePeriodId: string | null) {
  const queryClient = useQueryClient();
  const toggleRef = useRef<(taskId: string) => void>(() => {});

  const mutation = useMutation({
    mutationFn: toggleCoachingProgramTaskCompletion,
    onSuccess: async (task) => {
      if (task.is_completed) {
        toast.success("Görev tamamlandı.", {
          duration: UNDO_MS,
          action: { label: "Geri al", onClick: () => toggleRef.current(task.id) },
        });
      } else {
        toast.success("Görev yeniden açıldı.");
      }
      if (servicePeriodId) {
        await queryClient.invalidateQueries({ queryKey: COACHING_FAZ6_QUERY_KEYS.program(servicePeriodId) });
      }
    },
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });

  const toggle = (taskId: string) => mutation.mutate(taskId);
  toggleRef.current = toggle;

  return {
    toggle,
    /** The task whose request is in flight or whose list is still refreshing. */
    busyTaskId: mutation.isPending ? (mutation.variables ?? null) : null,
  };
}

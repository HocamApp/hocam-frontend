"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCoachingAvailability,
  deleteCoachingAvailability,
  extractCoachingErrorMessage,
  fetchCoachingAvailability,
  fetchCoachingCapacity,
  type CoachingAvailabilityPayload,
} from "@/lib/coachingApi";
import { CapacityPreviewCard } from "./CapacityPreviewCard";
import { CoachingAvailabilityEditor } from "./CoachingAvailabilityEditor";

export function CoachingAvailabilitySection({ showCapacity = true }: { showCapacity?: boolean }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const windowsQuery = useQuery({
    queryKey: ["coaching-availability"],
    queryFn: fetchCoachingAvailability,
  });
  const capacityQuery = useQuery({
    queryKey: ["coaching-capacity"],
    queryFn: fetchCoachingCapacity,
  });

  const refresh = () => {
    for (const queryKey of [
      ["coaching-availability"],
      ["coaching-capacity"],
      ["coaching-plan"],
      ["coaching-revenue-preview"],
      ["coaching-plan-preview"],
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
  };
  const mutationOptions = {
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (mutationError: unknown) => setError(extractCoachingErrorMessage(mutationError)),
  };
  const create = useMutation({
    mutationFn: (payload: CoachingAvailabilityPayload) => createCoachingAvailability(payload),
    ...mutationOptions,
  });
  const remove = useMutation({
    mutationFn: deleteCoachingAvailability,
    ...mutationOptions,
  });

  if (windowsQuery.isLoading || capacityQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }
  if (windowsQuery.isError) {
    return <ErrorMessage message={extractCoachingErrorMessage(windowsQuery.error)} />;
  }

  return (
    <div className="space-y-6">
      <CoachingAvailabilityEditor
        windows={windowsQuery.data ?? []}
        onCreate={(payload) => create.mutate(payload)}
        onDelete={(id) => remove.mutate(id)}
        isMutating={create.isPending || remove.isPending}
        error={error}
      />
      {showCapacity && capacityQuery.data ? <CapacityPreviewCard capacity={capacityQuery.data} /> : null}
    </div>
  );
}

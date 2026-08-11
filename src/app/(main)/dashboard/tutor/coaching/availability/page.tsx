"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingAvailabilityEditor } from "@/components/coaching/CoachingAvailabilityEditor";
import { CapacityPreviewCard } from "@/components/coaching/CapacityPreviewCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  createCoachingAvailability,
  deleteCoachingAvailability,
  extractCoachingErrorMessage,
  fetchCoachingAvailability,
  fetchCoachingCapacity,
  fetchCoachingPlan,
  type CoachingAvailabilityPayload,
} from "@/lib/coachingApi";

function AvailabilityContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ["coaching-plan"],
    queryFn: fetchCoachingPlan,
  });
  const { data: windows = [], isLoading: windowsLoading } = useQuery({
    queryKey: ["coaching-availability"],
    queryFn: fetchCoachingAvailability,
    enabled: Boolean(plan),
  });
  const { data: capacity } = useQuery({
    queryKey: ["coaching-capacity"],
    queryFn: fetchCoachingCapacity,
    enabled: Boolean(plan),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["coaching-availability"] });
    queryClient.invalidateQueries({ queryKey: ["coaching-capacity"] });
    queryClient.invalidateQueries({ queryKey: ["coaching-plan"] });
  };

  const mutationOptions = {
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError: (err: unknown) => setError(extractCoachingErrorMessage(err)),
  };

  const create = useMutation({
    mutationFn: (payload: CoachingAvailabilityPayload) =>
      createCoachingAvailability(payload),
    ...mutationOptions,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCoachingAvailability(id),
    ...mutationOptions,
  });

  if (planLoading || windowsLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!plan) {
    return (
      <EmptyState
        title="Önce bir koçluk planı oluştur"
        description="Müsaitlik, koçluk planına bağlıdır. Planını oluşturduktan sonra koçluk saatlerini belirleyebilirsin."
        action={
          <Button asChild>
            <Link href="/dashboard/tutor/coaching/plan">Plan oluştur</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <CoachingAvailabilityEditor
        windows={windows}
        onCreate={(payload) => create.mutate(payload)}
        onDelete={(id) => remove.mutate(id)}
        isMutating={create.isPending || remove.isPending}
        error={error}
      />
      {capacity ? <CapacityPreviewCard capacity={capacity} /> : null}
    </div>
  );
}

export default function CoachingAvailabilityPage() {
  return (
    <CoachingGuard>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Koçluk müsaitliği ve kapasite</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Koçluk saatlerin normal ders saatlerinden ayrıdır. Buraya eklemediğin
          saatler koçluk için açılmaz.
        </p>
        <div className="mt-6">
          <AvailabilityContent />
        </div>
      </div>
    </CoachingGuard>
  );
}

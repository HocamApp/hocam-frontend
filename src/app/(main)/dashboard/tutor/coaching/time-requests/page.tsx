"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COACHING_DAY_LABEL,
  TIME_REQUEST_STATUS_COPY,
  extractCoachingErrorMessage,
  fetchTutorCoachingTimeRequests,
  proposeCoachingTime,
} from "@/lib/coachingApi";

function ProposeForm({ timeRequestId }: { timeRequestId: string }) {
  const queryClient = useQueryClient();
  const [day, setDay] = useState("0");
  const [time, setTime] = useState("18:00");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      proposeCoachingTime(timeRequestId, { dayOfWeek: Number(day), startTime: time }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["coaching-tutor-time-requests"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground">Saat öner</p>
      {error ? <ErrorMessage message={error} /> : null}
      <div className="flex flex-wrap gap-2">
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className="rounded-md border bg-background p-2 text-sm"
        >
          {Object.entries(COACHING_DAY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-md border bg-background p-2 text-sm"
        />
        <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Gönderiliyor..." : "Öner"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Bu saat yayınladığın koçluk müsaitliğinin dışında olabilir; yine de dersle veya
        başka bir koçluk görüşmesiyle çakışmamalı.
      </p>
    </div>
  );
}

function TimeRequestsContent() {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["coaching-tutor-time-requests"],
    queryFn: fetchTutorCoachingTimeRequests,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="Bekleyen saat talebi yok"
        description="Bir öğrenci uygun saat bulamadığında burada bir talep açılır ve 48 saat içinde bir saat önermen gerekir."
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const pendingProposal = request.proposals.find((p) => p.status === "pending");
        return (
          <Card key={request.id}>
            <CardContent className="space-y-2 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={request.status === "pending" ? "default" : "secondary"}>
                  {TIME_REQUEST_STATUS_COPY[request.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Yanıt son tarihi:{" "}
                  {new Date(request.expires_at).toLocaleString("tr-TR")}
                </span>
              </div>
              {request.note ? (
                <p className="text-sm text-muted-foreground">&ldquo;{request.note}&rdquo;</p>
              ) : null}

              {pendingProposal ? (
                <p className="text-sm">
                  Önerin: {COACHING_DAY_LABEL[pendingProposal.day_of_week]}{" "}
                  {pendingProposal.start_time.slice(0, 5)} — öğrenci yanıtı bekleniyor.
                </p>
              ) : request.status === "pending" ? (
                <ProposeForm timeRequestId={request.id} />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function CoachingTimeRequestsPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell title="Koçluk saat talepleri" description="Öğrencilerin ortak saat bulamadığında ilettiği talepleri incele ve uygun bir koçluk saati öner." parentHref="/dashboard/tutor/coaching/students" parentLabel="Koçluk öğrencilerim" eyebrow="Saat planlama" width="narrow"><TimeRequestsContent /></CoachingPageShell>
    </CoachingGuard>
  );
}

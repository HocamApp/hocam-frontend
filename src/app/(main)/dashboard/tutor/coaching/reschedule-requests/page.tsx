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
  RESCHEDULE_STATUS_COPY,
  extractCoachingErrorMessage,
  fetchTutorCoachingRescheduleRequests,
  respondToCoachingRescheduleRequest,
} from "@/lib/coachingApi";

function RescheduleRequestsContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["coaching-tutor-reschedule-requests"],
    queryFn: fetchTutorCoachingRescheduleRequests,
  });

  const respond = useMutation({
    mutationFn: (params: {
      id: string;
      decision: "approve" | "reject";
      grantFree?: boolean;
    }) =>
      respondToCoachingRescheduleRequest(params.id, {
        decision: params.decision,
        grantFree: params.grantFree,
      }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["coaching-tutor-reschedule-requests"] });
    },
    onError: (err) => setError(extractCoachingErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");

  if (pending.length === 0) {
    return (
      <EmptyState
        title="Bekleyen değişiklik talebi yok"
        description="Bir öğrenci ücretsiz hakkını kullandıktan sonra yeni bir değişiklik istediğinde burada görünür."
      />
    );
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorMessage message={error} /> : null}
      {pending.map((request) => (
        <Card key={request.id}>
          <CardContent className="space-y-2 pt-6">
            <Badge variant="secondary">{RESCHEDULE_STATUS_COPY[request.status]}</Badge>
            <p className="text-sm">
              {new Date(request.original_start).toLocaleString("tr-TR")} →{" "}
              {new Date(request.proposed_start).toLocaleString("tr-TR")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: request.id, decision: "approve" })}
              >
                Onayla
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={respond.isPending}
                onClick={() =>
                  respond.mutate({ id: request.id, decision: "approve", grantFree: true })
                }
              >
                Ücretsiz onayla
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: request.id, decision: "reject" })}
              >
                Reddet
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CoachingRescheduleRequestsPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell title="Görüşme değişiklik talepleri" description="Öğrencinin koçluk görüşmesi için istediği tarih değişikliklerini mevcut hak ve durum bilgisiyle değerlendir." parentHref="/dashboard/tutor/coaching/students" parentLabel="Koçluk öğrencilerim" eyebrow="Planlama" width="narrow"><RescheduleRequestsContent /></CoachingPageShell>
    </CoachingGuard>
  );
}

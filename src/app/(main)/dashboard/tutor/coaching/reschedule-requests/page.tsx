"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingRecordGuard as CoachingGuard } from "@/components/coaching/CoachingGuard";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
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
import { coachingDateTimeLabel } from "@/lib/coachingTime";

function RescheduleRequestsContent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

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
      setRejectingId(null);
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
        steps={["Öğrenci yeni saat ister", "Mevcut hak ve durumla değerlendirirsin"]}
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
            <p className="text-body font-medium text-ink">{request.student_name ?? "Öğrenci"}</p>
            <p className="text-sm text-ink">
              {coachingDateTimeLabel(request.original_start)} →{" "}
              {coachingDateTimeLabel(request.proposed_start)}
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
                Acil durum olarak onayla
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={respond.isPending}
                onClick={() => setRejectingId(request.id)}
              >
                Reddet
              </Button>
            </div>
            <p className="text-small text-ink-mid">
              İki onay da öğrencinin ücretsiz değişiklik hakkını kullanmaz. &quot;Acil
              durum olarak onayla&quot;, değişikliği senin verdiğin bir acil durum izni
              olarak kaydeder.
            </p>
          </CardContent>
        </Card>
      ))}
      <CoachingConfirmDialog
        open={rejectingId !== null}
        title="Saat değişikliği reddedilsin mi?"
        description="Görüşme mevcut saatinde kalır ve öğrenciye bildirilir. Bu kararı sonra değiştiremezsin."
        confirmLabel="Reddet"
        isPending={respond.isPending}
        onCancel={() => setRejectingId(null)}
        onConfirm={() => {
          if (rejectingId) respond.mutate({ id: rejectingId, decision: "reject" });
        }}
      />
    </div>
  );
}

export default function CoachingRescheduleRequestsPage() {
  return (
    <CoachingGuard>
      <CoachingPageShell title="Görüşme değişiklik talepleri" width="wide" currentHref="/dashboard/tutor/coaching/reschedule-requests" audience="tutor"><RescheduleRequestsContent /></CoachingPageShell>
    </CoachingGuard>
  );
}

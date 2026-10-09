"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { InlineError } from "@/components/shared/InlineError";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import {
  COACHING_FAZ8_QUERY_KEYS,
  coachingDisputeCategoryLabel,
  coachingDisputeStatusLabel,
  fetchTutorCoachingDispute,
  respondToTutorCoachingDispute,
} from "@/lib/coachingApi";

function Detail() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const client = useQueryClient();
  const [body, setBody] = useState("");
  const query = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDispute(disputeId),
    queryFn: () => fetchTutorCoachingDispute(disputeId),
  });
  const response = useMutation({
    mutationFn: () => respondToTutorCoachingDispute(disputeId, body),
    onSuccess: () => {
      setBody("");
      client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDispute(disputeId) });
      client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDisputes() });
    },
  });
  if (query.isLoading)
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (query.isError && (query.error as { response?: { status?: number } })?.response?.status !== 404)
    return (
      <CoachingLoadError
        message="Sorun bildirimi yüklenemedi."
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  if (!query.data)
    return (
      <CoachingEmptyState
        title="Sorun bildirimi bulunamadı"
        description="Bu kayıt artık erişilebilir değil veya sana ait değil."
      />
    );
  const dispute = query.data;
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-2 py-5">
          <div className="flex justify-between gap-3">
            <div>
              <CoachingSectionHeading>Sorun özeti</CoachingSectionHeading>
              <p className="text-sm text-ink-mid">
                {coachingDisputeCategoryLabel(dispute.category)}
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-line bg-transparent text-ink">
              {coachingDisputeStatusLabel(dispute.status)}
            </Badge>
          </div>
          <p className="text-sm text-ink-mid">
            Öğrenci açıklaması, personel notları ve sunulmayan kanıtlar gizlidir.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 py-5">
          <CoachingSectionHeading level="subsection">Paylaşılan kanıtlar</CoachingSectionHeading>
          {dispute.evidence.length ? (
            dispute.evidence.map((item) => (
              <p key={item.id} className="rounded-input border border-line p-2 text-sm text-ink">
                {item.original_name}
              </p>
            ))
          ) : (
            <p className="text-sm text-ink-mid">Sana açıklanmış kanıt yok.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 py-5">
          <CoachingSectionHeading level="subsection">Ek bağlam paylaş</CoachingSectionHeading>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="İncelemeye yardımcı olacak kısa bağlam"
            aria-label="Destek ekibine ek bağlam"
          />
          <Button disabled={!body.trim() || response.isPending} onClick={() => response.mutate()}>
            {response.isPending ? "Gönderiliyor…" : "Yanıt gönder"}
          </Button>
          <InlineError size="sm" message={response.error ? "Yanıt gönderilemedi. Tekrar dene." : null} />
        </CardContent>
      </Card>
      {dispute.tutor_responses.map((item, index) => (
        <Card key={`${item.created_at}-${index}`}>
          <CardContent className="py-3 text-sm">{item.body}</CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TutorCoachingComplaintDetailPage() {
  return (
    <CoachingRecordGuard>
      <CoachingPageShell
        title="Koçluk sorun bildirimi"
        width="wide"
        currentHref="/dashboard/tutor/coaching/complaints"
        audience="tutor"
      >
        <Detail />
      </CoachingPageShell>
    </CoachingRecordGuard>
  );
}

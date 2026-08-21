"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CoachingRecordGuard } from "@/components/coaching/CoachingGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import { COACHING_FAZ8_QUERY_KEYS, coachingDisputeCategoryLabel, coachingDisputeStatusLabel, fetchTutorCoachingDispute, respondToTutorCoachingDispute } from "@/lib/coachingApi";

function Detail() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const client = useQueryClient();
  const [body, setBody] = useState("");
  const query = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDispute(disputeId), queryFn: () => fetchTutorCoachingDispute(disputeId) });
  const response = useMutation({ mutationFn: () => respondToTutorCoachingDispute(disputeId, body), onSuccess: () => { setBody(""); client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDispute(disputeId) }); client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.tutorDisputes() }); } });
  if (query.isLoading) return <div className="flex min-h-[12rem] items-center justify-center"><LoadingSpinner /></div>;
  if (!query.data) return <CoachingEmptyState title="Başvuru bulunamadı" description="Bu kayıt artık erişilebilir değil veya sana ait değil." />;
  const dispute = query.data;
  return <div className="space-y-5"><Card><CardContent className="space-y-2 py-5"><div className="flex justify-between gap-3"><div><CoachingSectionHeading>Başvuru özeti</CoachingSectionHeading><p className="text-sm text-muted-foreground">{coachingDisputeCategoryLabel(dispute.category)}</p></div><Badge>{coachingDisputeStatusLabel(dispute.status)}</Badge></div><p className="text-sm text-muted-foreground">Öğrenci açıklaması, personel notları ve sunulmayan kanıtlar gizlidir.</p></CardContent></Card>
    <Card><CardContent className="space-y-3 py-5"><CoachingSectionHeading level="subsection">Paylaşılan kanıtlar</CoachingSectionHeading>{dispute.evidence.length ? dispute.evidence.map((item) => <p key={item.id} className="rounded border p-2 text-sm">{item.original_name} · {item.mime_type}</p>) : <p className="text-sm text-muted-foreground">Sana açıklanmış kanıt yok.</p>}</CardContent></Card>
    <Card><CardContent className="space-y-3 py-5"><CoachingSectionHeading level="subsection">Ek bağlam paylaş</CoachingSectionHeading><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="İncelemeye yardımcı olacak kısa bağlam" /><Button disabled={!body.trim() || response.isPending} onClick={() => response.mutate()}>{response.isPending ? "Gönderiliyor…" : "Yanıt gönder"}</Button>{response.error ? <p className="text-sm text-destructive">Yanıt gönderilemedi.</p> : null}</CardContent></Card>
    {dispute.tutor_responses.map((item, index) => <Card key={`${item.created_at}-${index}`}><CardContent className="py-3 text-sm">{item.body}</CardContent></Card>)}
  </div>;
}

export default function TutorCoachingComplaintDetailPage() { return <CoachingRecordGuard><CoachingPageShell title="Koçluk başvurusu" description="Paylaşılması uygun başvuru durumunu ve kanıtları incele; gerekiyorsa ek bağlam ilet." parentHref="/dashboard/tutor/coaching/complaints" parentLabel="Koçluk başvuruları" eyebrow="Başvuru detayı" width="narrow" currentHref="/dashboard/tutor/coaching/complaints" audience="tutor"><Detail /></CoachingPageShell></CoachingRecordGuard>; }

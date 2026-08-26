"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import { COACHING_FAZ8_QUERY_KEYS, applyStudentCoachingDisputeRemedy, coachingDisputeCategoryLabel, coachingDisputeMeritLabel, coachingDisputeRemedyLabel, coachingDisputeStatusLabel, coachingEvidenceScanStateLabel, fetchCoachingDisputeEvidenceAccessUrl, fetchStudentCoachingDispute, requestCoachingDisputeEvidenceDeletion, uploadCoachingDisputeEvidence } from "@/lib/coachingApi";

function Detail() {
  const params = useParams<{ disputeId: string }>();
  const disputeId = params.disputeId;
  const client = useQueryClient();
  const query = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDispute(disputeId), queryFn: () => fetchStudentCoachingDispute(disputeId) });
  const refresh = () => { client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDispute(disputeId) }); client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes() }); };
  const upload = useMutation({ mutationFn: (file: File) => uploadCoachingDisputeEvidence(disputeId, file), onSuccess: refresh });
  const remove = useMutation({ mutationFn: requestCoachingDisputeEvidenceDeletion, onSuccess: refresh });
  const access = useMutation({ mutationFn: fetchCoachingDisputeEvidenceAccessUrl, onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer") });
  const remedy = useMutation({ mutationFn: (remedy_type: string) => applyStudentCoachingDisputeRemedy(disputeId, { remedy_type, determination_id: query.data!.determination!.id }), onSuccess: refresh, onError: refresh });
  if (query.isLoading) return <div className="flex min-h-[12rem] items-center justify-center"><LoadingSpinner /></div>;
  if (!query.data) return <CoachingEmptyState title="Başvuru bulunamadı" description="Bu kayıt artık erişilebilir değil veya hesabına ait değil." />;
  const dispute = query.data;
  return <div className="space-y-5"><Card><CardContent className="space-y-3 py-5"><div className="flex justify-between gap-2"><div><CoachingSectionHeading>Başvuru özeti</CoachingSectionHeading><p className="text-sm text-muted-foreground">{coachingDisputeCategoryLabel(dispute.category)}</p></div><Badge>{coachingDisputeStatusLabel(dispute.status)}</Badge></div><p className="whitespace-pre-wrap text-sm">{dispute.description}</p></CardContent></Card>
    {dispute.status === "needs_more_info" ? <Card><CardContent className="space-y-1 py-4"><CoachingSectionHeading level="subsection">Ek bilgi gerekli</CoachingSectionHeading><p className="text-sm text-muted-foreground">Süreç mesajını inceleyip istenen bağlamı veya kanıtı aşağıdan ekleyebilirsin. Bu durum tek başına bir iade ya da çözüm kararı değildir.</p></CardContent></Card> : null}
    <Card><CardContent className="space-y-3 py-5"><CoachingSectionHeading level="subsection">Kanıtlar</CoachingSectionHeading><input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); }} disabled={upload.isPending} />
      {upload.error ? <p className="text-sm text-destructive">Dosya yüklenemedi; doğrulama sonucunu tekrar kontrol et.</p> : null}
      {dispute.evidence.map((item) => <div className="flex items-center justify-between gap-2 rounded border p-2 text-sm" key={item.id}><span>{item.original_name} · {coachingEvidenceScanStateLabel(item.scan_state)}{item.deleted_requested ? " · silme talebi alındı" : ""}</span><div className="flex gap-1">{item.scan_state === "active" && !item.deleted_requested ? <Button size="sm" variant="ghost" disabled={access.isPending} onClick={() => access.mutate(item.id)}>Görüntüle</Button> : null}<Button size="sm" variant="ghost" disabled={item.deleted_requested || remove.isPending} onClick={() => remove.mutate(item.id)}>Silme iste</Button></div></div>)}
      <p className="text-xs text-muted-foreground">Tarama tamamlanmamış, kullanılamayan veya reddedilen kanıtlar başvuru kararı için geçerli sayılmaz.</p></CardContent></Card>
    {dispute.timeline.length ? <Card><CardContent className="space-y-2 py-5"><CoachingSectionHeading level="subsection">Süreç</CoachingSectionHeading>{dispute.timeline.map((item, index) => <p className="text-sm" key={`${item.created_at}-${index}`}>{item.participant_message || "Süreç güncellemesi"}</p>)}</CardContent></Card> : null}
    {dispute.determination?.allowed_remedies.length && !dispute.application ? <Card><CardContent className="space-y-3 py-5"><CoachingSectionHeading level="subsection">Seçimin gerekli</CoachingSectionHeading><p className="text-sm text-muted-foreground">İnceleme sonucu: {coachingDisputeMeritLabel(dispute.determination.merit)}. Sunucunun uygun gördüğü seçeneklerden birini seçebilirsin.</p>{dispute.determination.allowed_remedies.map((item) => <Button key={item} className="mr-2" title={item} disabled={remedy.isPending} onClick={() => remedy.mutate(item)}>{coachingDisputeRemedyLabel(item)}</Button>)}{remedy.error ? <p className="text-sm text-destructive">Sonuç değişmiş olabilir; güncel karar yeniden yüklendi.</p> : null}</CardContent></Card> : null}
  </div>;
}

export default function StudentCoachingComplaintDetailPage() { return <RouteGuard requireAuth requireRole="student"><CoachingPageShell title="Koçluk başvurusu" description="Başvuru durumunu, kanıtlarını ve sunucu tarafından açılan çözüm seçeneklerini takip et." parentHref="/dashboard/student/coaching/complaints" parentLabel="Koçluk başvurularım" eyebrow="Başvuru detayı" width="narrow" currentHref="/dashboard/student/coaching/complaints" audience="student"><Detail /></CoachingPageShell></RouteGuard>; }

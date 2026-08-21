"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import {
  COACHING_FAZ8_QUERY_KEYS,
  cancelStudentCoaching,
  coachingDisputeCategoryLabel,
  coachingDisputeStatusLabel,
  coachingRefundStateCopy,
  coachingServiceStatusLabel,
  createStudentCoachingDispute,
  fetchCoachingDisputeEligibility,
  fetchCoachingSchedulingState,
  fetchStudentCoachingDisputes,
  fetchStudentCoachingFinancialSummary,
} from "@/lib/coachingApi";
import { formatTryMinor } from "@/lib/money";

function NewDisputeForm({ purchaseId }: { purchaseId: string }) {
  const queryClient = useQueryClient();
  const eligibility = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.eligibility(purchaseId),
    queryFn: () => fetchCoachingDisputeEligibility(purchaseId),
  });
  const create = useMutation({
    mutationFn: (data: { category: string; description: string }) =>
      createStudentCoachingDispute(purchaseId, { ...data, submission_key: crypto.randomUUID() }),
    onSuccess: (dispute) => {
      queryClient.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes() });
      window.location.assign(`/dashboard/student/coaching/complaints/${dispute.id}`);
    },
  });
  const categories = eligibility.data?.categories ?? [];
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  // The server decides which reasons are open right now; the local state can
  // lag a refetch, so the submitted value is always taken from the live list.
  const selected = categories.includes(category) ? category : categories[0] ?? "";
  const canSubmit = Boolean(selected) && Boolean(description.trim()) && !create.isPending;

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <CoachingSectionHeading
          level="subsection"
          description="Konu ve kapsam sunucunun mevcut koçluk kaydından doğrulanır."
        >
          Koçluk başvurusu oluştur
        </CoachingSectionHeading>
        {eligibility.isLoading ? (
          <LoadingSpinner />
        ) : eligibility.isError ? (
          <p className="text-sm text-destructive">
            Başvuru konuları şu anda getirilemedi. Sayfayı yenileyip tekrar dene.
          </p>
        ) : categories.length === 0 ? (
          // An empty list is an answer, not a failure: nothing is currently
          // eligible. Offering a placeholder reason here only produced a
          // paragraph of writing that the server then rejected.
          <p className="text-sm text-muted-foreground">
            Şu anda başvuru açabileceğin bir konu görünmüyor. Koçluk kaydın ilerledikçe
            uygun konular burada listelenir.
          </p>
        ) : (
          <>
            <select
              className="w-full rounded-md border bg-background p-2 text-sm"
              aria-label="Başvuru konusu"
              value={selected}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{coachingDisputeCategoryLabel(item)}</option>
              ))}
            </select>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Durumu kısaca açıkla" />
          </>
        )}
        {create.error ? <p className="text-sm text-destructive">Başvuru oluşturulamadı. Lütfen güncel durumu tekrar kontrol et.</p> : null}
        <Button disabled={!canSubmit} onClick={() => create.mutate({ category: selected, description })}>
          {create.isPending ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ComplaintsContent() {
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: ["coaching-scheduling-state"], queryFn: fetchCoachingSchedulingState });
  const purchaseId = state.data?.id;
  const disputes = useQuery({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes(), queryFn: fetchStudentCoachingDisputes });
  const financial = useQuery({
    queryKey: purchaseId ? COACHING_FAZ8_QUERY_KEYS.financialSummary(purchaseId) : ["coaching-financial-summary", "none"],
    queryFn: () => fetchStudentCoachingFinancialSummary(purchaseId!), enabled: Boolean(purchaseId),
  });
  const cancel = useMutation({
    mutationFn: () => cancelStudentCoaching(purchaseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-scheduling-state"] });
      queryClient.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.financialSummary(purchaseId!) });
    },
  });

  if (state.isLoading || disputes.isLoading) return <div className="flex min-h-[12rem] items-center justify-center"><LoadingSpinner /></div>;
  if (!purchaseId) return <EmptyState title="Koçluk kaydı bulunamadı" description="Koçluk başvuruları aktif bir koçluk satın alımıyla ilişkilidir." steps={["Aktif koçluk kaydı doğrulanır", "Başvuru alanı hizmete bağlanır"]} />;
  return <div className="space-y-6">
    <NewDisputeForm purchaseId={purchaseId} />
    <Card><CardContent className="space-y-3 py-5"><div className="flex items-center justify-between gap-2"><CoachingSectionHeading level="subsection">Koçluk iptali ve iade durumu</CoachingSectionHeading><Badge variant="secondary">{financial.data ? coachingServiceStatusLabel(financial.data.service_status) : "Yükleniyor"}</Badge></div>
      <p className="text-sm text-muted-foreground">{financial.data ? coachingRefundStateCopy(financial.data.refund_state) : "Finansal durum yükleniyor."}</p>
      {financial.data ? <p className="text-xs text-muted-foreground">Sunucu kaydındaki iade yükümlülüğü: {formatTryMinor(financial.data.refund_liability_minor)}.</p> : null}
      {financial.data?.cancellation_pending ? <p className="text-sm">İptal talebin işleniyor; aktif dönem geçmiş kayıtlarda korunur.</p> : <Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Koçluğu sonlandırmayı iste</Button>}
      {cancel.error ? <p className="text-sm text-destructive">İptal talebi güncel durumla çakıştı; sayfayı yenileyip tekrar dene.</p> : null}
    </CardContent></Card>
    <section className="space-y-3"><CoachingSectionHeading>Başvurularım</CoachingSectionHeading>{disputes.data?.length ? disputes.data.map((dispute) => <Link key={dispute.id} href={`/dashboard/student/coaching/complaints/${dispute.id}`}><Card className="mb-3 transition-colors hover:bg-muted/50"><CardContent className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{coachingDisputeCategoryLabel(dispute.category)}</p><p className="text-sm text-muted-foreground">{new Date(dispute.submitted_at).toLocaleString("tr-TR")}</p></div><Badge>{coachingDisputeStatusLabel(dispute.status)}</Badge></CardContent></Card></Link>) : <EmptyState title="Henüz başvurun yok" description="Bir sorun olduğunda başvurunu buradan takip edebilirsin." steps={["Başvurunu ve kanıtını paylaşırsın", "Paylaşılabilir süreç güncellemelerini izlersin"]} />}</section>
  </div>;
}

export default function StudentCoachingComplaintsPage() {
  return <RouteGuard requireAuth requireRole="student"><CoachingPageShell title="Koçluk başvurularım" description="Bir sorun olduğunda başvuru oluştur, paylaşılmış finansal durumu incele ve mevcut süreci takip et." parentHref="/dashboard/student/coaching" parentLabel="Çalışma koçluğum" eyebrow="Başvurular" width="narrow" currentHref="/dashboard/student/coaching/complaints" audience="student"><ComplaintsContent /></CoachingPageShell></RouteGuard>;
}

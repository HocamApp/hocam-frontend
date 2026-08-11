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
import {
  COACHING_FAZ8_QUERY_KEYS,
  cancelStudentCoaching,
  coachingRefundStateCopy,
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
  const [category, setCategory] = useState("scope_deficient");
  const [description, setDescription] = useState("");

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div>
          <h2 className="font-semibold">Koçluk başvurusu oluştur</h2>
          <p className="mt-1 text-sm text-muted-foreground">Konu ve kapsam sunucunun mevcut koçluk kaydından doğrulanır.</p>
        </div>
        {eligibility.isLoading ? <LoadingSpinner /> : null}
        <select className="w-full rounded-md border bg-background p-2 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.length ? categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          )) : <option value="scope_deficient">Koçluk kapsamı</option>}
        </select>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Durumu kısaca açıkla" />
        {create.error ? <p className="text-sm text-destructive">Başvuru oluşturulamadı. Lütfen güncel durumu tekrar kontrol et.</p> : null}
        <Button disabled={!description.trim() || create.isPending} onClick={() => create.mutate({ category, description })}>
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
  if (!purchaseId) return <EmptyState title="Koçluk kaydı bulunamadı" description="Koçluk başvuruları aktif bir koçluk satın alımıyla ilişkilidir." />;
  return <div className="space-y-6">
    <NewDisputeForm purchaseId={purchaseId} />
    <Card><CardContent className="space-y-3 py-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Koçluk iptali ve iade durumu</h2><Badge variant="secondary">{financial.data?.service_status ?? "Yükleniyor"}</Badge></div>
      <p className="text-sm text-muted-foreground">{financial.data ? coachingRefundStateCopy(financial.data.refund_state) : "Finansal durum yükleniyor."}</p>
      {financial.data ? <p className="text-xs text-muted-foreground">Sunucu kaydındaki iade yükümlülüğü: {formatTryMinor(financial.data.refund_liability_minor)}.</p> : null}
      {financial.data?.cancellation_pending ? <p className="text-sm">İptal talebin işleniyor; aktif dönem geçmiş kayıtlarda korunur.</p> : <Button variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>Koçluğu sonlandırmayı iste</Button>}
      {cancel.error ? <p className="text-sm text-destructive">İptal talebi güncel durumla çakıştı; sayfayı yenileyip tekrar dene.</p> : null}
    </CardContent></Card>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Başvurularım</h2>{disputes.data?.length ? disputes.data.map((dispute) => <Link key={dispute.id} href={`/dashboard/student/coaching/complaints/${dispute.id}`}><Card className="mb-3 transition-colors hover:bg-muted/50"><CardContent className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{dispute.category}</p><p className="text-sm text-muted-foreground">{new Date(dispute.submitted_at).toLocaleString("tr-TR")}</p></div><Badge>{dispute.status}</Badge></CardContent></Card></Link>) : <EmptyState title="Henüz başvurun yok" description="Bir sorun olduğunda başvurunu buradan takip edebilirsin." />}</section>
  </div>;
}

export default function StudentCoachingComplaintsPage() {
  return <RouteGuard requireAuth requireRole="student"><CoachingPageShell title="Koçluk başvurularım" description="Bir sorun olduğunda başvuru oluştur, paylaşılmış finansal durumu incele ve mevcut süreci takip et." parentHref="/dashboard/student/coaching" parentLabel="Çalışma koçluğum" eyebrow="Başvurular" width="narrow"><ComplaintsContent /></CoachingPageShell></RouteGuard>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
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
      createStudentCoachingDispute(purchaseId, {
        ...data,
        submission_key: crypto.randomUUID(),
      }),
    onSuccess: (dispute) => {
      queryClient.invalidateQueries({
        queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes(),
      });
      window.location.assign(
        `/dashboard/student/coaching/complaints/${dispute.id}`,
      );
    },
  });
  const categories = eligibility.data?.categories ?? [];
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  // The server decides which reasons are open right now; the local state can
  // lag a refetch, so the submitted value is always taken from the live list.
  const selected = categories.includes(category)
    ? category
    : (categories[0] ?? "");
  const canSubmit =
    Boolean(selected) && Boolean(description.trim()) && !create.isPending;

  return (
    <Card className="text-ink">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <CoachingSectionHeading
          level="subsection"
          description="Konu ve kapsam sunucunun mevcut koçluk kaydından doğrulanır."
        >
          Koçluk başvurusu oluştur
        </CoachingSectionHeading>
        {eligibility.isLoading ? (
          <div aria-label="Başvuru konuları yükleniyor" className="space-y-3">
            <div className="h-11 animate-pulse rounded-input bg-[var(--skeleton)]" />
            <div className="h-32 animate-pulse rounded-input bg-[var(--skeleton)]" />
          </div>
        ) : eligibility.isError ? (
          <p className="text-small text-error">
            Başvuru konuları şu anda getirilemedi. Sayfayı yenileyip tekrar
            dene.
          </p>
        ) : categories.length === 0 ? (
          // An empty list is an answer, not a failure: nothing is currently
          // eligible. Offering a placeholder reason here only produced a
          // paragraph of writing that the server then rejected.
          <p className="text-small leading-[1.5] text-ink-mid">
            Şu anda başvuru açabileceğin bir konu görünmüyor. Koçluk kaydın
            ilerledikçe uygun konular burada listelenir.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label
                htmlFor="coaching-dispute-category"
                className="block text-label font-medium text-ink"
              >
                Başvuru konusu
              </label>
              <select
                id="coaching-dispute-category"
                className="h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink transition-colors duration-[--duration-state] focus:border-ink focus:outline-none"
                aria-label="Başvuru konusu"
                value={selected}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {coachingDisputeCategoryLabel(item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="coaching-dispute-description"
                className="block text-label font-medium text-ink"
              >
                Durumun açıklaması
              </label>
              <Textarea
                id="coaching-dispute-description"
                className="min-h-32 bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Durumu kısaca açıkla"
              />
            </div>
          </>
        )}
        {create.error ? (
          <p className="text-small text-error">
            Başvuru oluşturulamadı. Güncel durumu tekrar kontrol et.
          </p>
        ) : null}
        <Button
          disabled={!canSubmit}
          onClick={() => create.mutate({ category: selected, description })}
        >
          {create.isPending ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ComplaintsContent() {
  const queryClient = useQueryClient();
  const state = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });
  const purchaseId = state.data?.id;
  const disputes = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes(),
    queryFn: fetchStudentCoachingDisputes,
  });
  const financial = useQuery({
    queryKey: purchaseId
      ? COACHING_FAZ8_QUERY_KEYS.financialSummary(purchaseId)
      : ["coaching-financial-summary", "none"],
    queryFn: () => fetchStudentCoachingFinancialSummary(purchaseId!),
    enabled: Boolean(purchaseId),
  });
  const cancel = useMutation({
    mutationFn: () => cancelStudentCoaching(purchaseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["coaching-scheduling-state"],
      });
      queryClient.invalidateQueries({
        queryKey: COACHING_FAZ8_QUERY_KEYS.financialSummary(purchaseId!),
      });
    },
  });

  if (state.isLoading || disputes.isLoading)
    return <CoachingLoadingState rows={3} />;
  if (!purchaseId)
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Koçluk kaydı bulunamadı"
        description="Koçluk başvuruları aktif bir koçluk satın alımıyla ilişkilidir."
        steps={[
          "Aktif koçluk kaydı doğrulanır",
          "Başvuru alanı hizmete bağlanır",
        ]}
      />
    );
  return (
    <div className="space-y-6">
      <NewDisputeForm purchaseId={purchaseId} />
      <Card className="text-ink">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CoachingSectionHeading level="subsection">
              Koçluk iptali ve iade durumu
            </CoachingSectionHeading>
            <Badge
              variant="outline"
              className="w-fit border-line bg-transparent text-ink"
            >
              {financial.data
                ? coachingServiceStatusLabel(financial.data.service_status)
                : "Yükleniyor"}
            </Badge>
          </div>
          <p className="text-body text-ink-mid">
            {financial.data
              ? coachingRefundStateCopy(financial.data.refund_state)
              : "Finansal durum yükleniyor."}
          </p>
          {financial.data ? (
            <p className="text-small text-ink-mid tabular-nums">
              Sunucu kaydındaki iade yükümlülüğü:{" "}
              {formatTryMinor(financial.data.refund_liability_minor)}.
            </p>
          ) : null}
          {financial.data?.cancellation_pending ? (
            <p className="text-body">
              İptal talebin işleniyor, aktif dönem geçmiş kayıtlarda korunur.
            </p>
          ) : (
            <Button
              variant="outline"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Koçluğu sonlandırmayı iste
            </Button>
          )}
          {cancel.error ? (
            <p className="text-small text-error">
              İptal talebi güncel durumla çakıştı. Sayfayı yenileyip tekrar
              dene.
            </p>
          ) : null}
        </CardContent>
      </Card>
      <section className="space-y-4">
        <CoachingSectionHeading>Başvurularım</CoachingSectionHeading>
        {disputes.data?.length ? (
          disputes.data.map((dispute) => (
            <Link
              key={dispute.id}
              href={`/dashboard/student/coaching/complaints/${dispute.id}`}
            >
              <Card className="mb-3 text-ink transition-colors duration-[--duration-state] hover:border-ink">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-body font-medium">
                      {coachingDisputeCategoryLabel(dispute.category)}
                    </p>
                    <p className="mt-1 text-small text-ink-mid tabular-nums">
                      {new Date(dispute.submitted_at).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="w-fit border-line bg-transparent text-ink"
                  >
                    {coachingDisputeStatusLabel(dispute.status)}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="Henüz başvurun yok"
            description="Bir sorun olduğunda başvurunu buradan takip edebilirsin."
            steps={[
              "Başvurunu ve kanıtını paylaşırsın",
              "Paylaşılabilir süreç güncellemelerini izlersin",
            ]}
          />
        )}
      </section>
    </div>
  );
}

export default function StudentCoachingComplaintsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Koçluk başvurularım"
        description="Bir sorun olduğunda başvuru oluştur, paylaşılmış finansal durumu incele ve mevcut süreci takip et."
        parentHref="/dashboard/student/coaching"
        parentLabel="Çalışma koçluğum"
        eyebrow="Başvurular"
        width="narrow"
        currentHref="/dashboard/student/coaching/complaints"
        audience="student"
      >
        <ComplaintsContent />
      </CoachingPageShell>
    </RouteGuard>
  );
}

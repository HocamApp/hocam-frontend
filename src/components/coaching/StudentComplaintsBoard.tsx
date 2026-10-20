"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "@phosphor-icons/react";

import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingEmptyState as EmptyState } from "@/components/coaching/CoachingEmptyState";
import { NewComplaintForm } from "@/components/coaching/NewComplaintForm";
import { StudentComplaintCards } from "@/components/coaching/StudentComplaintCards";
import { StudentEndCoachingSection } from "@/components/coaching/StudentEndCoachingSection";
import { Button } from "@/components/ui/button";
import {
  COACHING_FAZ8_QUERY_KEYS,
  fetchCoachingSchedulingState,
  fetchStudentCoachingDisputes,
} from "@/lib/coachingApi";
import { buildComplaintCards, complaintsSummary } from "@/lib/coachingStudentComplaints";

/**
 * Sorun bildir. The student's complaints come first, because what most people
 * open this page for is how a report they filed stands; a form is one button
 * away, and open from the start only when nothing has been filed. The
 * complaints load on their own, so a coaching that cannot be read does not hide
 * them, and a list that failed to load never reads as an empty one.
 */
export function StudentComplaintsBoard() {
  const initialTopic = useSearchParams().get("konu");
  const [formOpen, setFormOpen] = useState(Boolean(initialTopic));

  const state = useQuery({
    queryKey: ["coaching-scheduling-state"],
    queryFn: fetchCoachingSchedulingState,
  });
  const disputes = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes(),
    queryFn: fetchStudentCoachingDisputes,
  });
  const purchaseId = state.data?.id;
  const cards = useMemo(() => buildComplaintCards(disputes.data ?? []), [disputes.data]);

  if (state.isLoading || disputes.isLoading) return <CoachingLoadingState rows={3} />;

  if (!state.isError && !purchaseId && disputes.isSuccess && cards.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Koçluk kaydı bulunamadı"
        description="Koçluk sorun bildirimleri aktif bir koçluk satın alımıyla ilişkilidir."
        steps={["Aktif koçluk kaydı doğrulanır", "Sorun bildirimi hizmete bağlanır"]}
      />
    );
  }

  const nothingFiled = disputes.isSuccess && cards.length === 0;
  const showForm = Boolean(purchaseId) && (formOpen || nothingFiled);

  return (
    <div className="space-y-8">
      <section aria-label="Bildirimlerin" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div>
            <h2 className="text-[1.375rem] font-medium leading-[1.3] tracking-[-0.01em] text-ink">Bildirimlerin</h2>
            {cards.length > 0 ? (
              <p className="text-small text-ink-mid">{complaintsSummary(cards)}</p>
            ) : null}
          </div>
          {purchaseId && cards.length > 0 && !showForm ? (
            <Button type="button" variant="gold" className="min-h-11" onClick={() => setFormOpen(true)}>
              Yeni sorun bildir
            </Button>
          ) : null}
        </div>

        {disputes.isError ? (
          <CoachingLoadError
            message="Bildirimlerin yüklenemedi."
            onRetry={() => disputes.refetch()}
            isRetrying={disputes.isFetching}
          />
        ) : cards.length > 0 ? (
          <StudentComplaintCards cards={cards} />
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="Henüz bildirdiğin bir sorun yok"
            description="Bir sorun olduğunda bildirimini buradan takip edebilirsin."
            steps={["Sorunu ve kanıtını paylaşırsın", "Paylaşılabilir süreç güncellemelerini izlersin"]}
          />
        )}
      </section>

      {state.isError ? (
        <CoachingLoadError
          message="Koçluk bilgilerin yüklenemedi."
          onRetry={() => state.refetch()}
          isRetrying={state.isFetching}
        />
      ) : null}

      {showForm && purchaseId ? (
        <NewComplaintForm
          purchaseId={purchaseId}
          initialTopic={initialTopic}
          onClose={cards.length > 0 ? () => setFormOpen(false) : undefined}
        />
      ) : null}

      {purchaseId ? <StudentEndCoachingSection purchaseId={purchaseId} /> : null}
    </div>
  );
}

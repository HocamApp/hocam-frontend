"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COACHING_FAZ8_QUERY_KEYS,
  cancelStudentCoaching,
  fetchStudentCoachingFinancialSummary,
} from "@/lib/coachingApi";
import { refundLine } from "@/lib/coachingStudentComplaints";

/**
 * "Koçluğu sonlandır": the student's way to end the coaching, in a section of its
 * own at the foot of the page rather than among the complaints. It says what
 * happens, asks once more, and speaks of a refund only when the server has
 * recorded one. Without knowing whether an ending is already under way it offers
 * no button: pressing blind would only run into the server's answer.
 */
export function StudentEndCoachingSection({ purchaseId }: { purchaseId: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const financial = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.financialSummary(purchaseId),
    queryFn: () => fetchStudentCoachingFinancialSummary(purchaseId),
  });
  const cancel = useMutation({
    mutationFn: () => cancelStudentCoaching(purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching-scheduling-state"] });
      queryClient.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.financialSummary(purchaseId) });
    },
  });

  const refund = financial.data
    ? refundLine({ state: financial.data.refund_state, liability_minor: financial.data.refund_liability_minor })
    : null;

  return (
    <section aria-label="Koçluğu sonlandır" className="space-y-3 border-t border-line pt-6">
      <h2 className="text-body font-medium text-ink">Koçluğu sonlandır</h2>
      <p className="max-w-xl text-small leading-[1.5] text-ink-mid">
        Devam eden dönem sonuna kadar sürer, sonraki haftalar iptal edilir. Ders paketin etkilenmez. Bu talep geri
        alınamaz.
      </p>

      {financial.isLoading ? (
        <Skeleton className="h-11 w-48 rounded-pill" aria-hidden="true" />
      ) : financial.isError ? (
        <CoachingLoadError
          message="İptal durumu yüklenemedi."
          onRetry={() => financial.refetch()}
          isRetrying={financial.isFetching}
        />
      ) : financial.data?.cancellation_pending ? (
        <p className="text-body text-ink">
          İptal talebin alındı. Bu haftanın görüşmesi planlandığı gibi yapılır; sonraki haftalar iptal edildi.
        </p>
      ) : (
        <Button type="button" variant="destructive" disabled={cancel.isPending} onClick={() => setConfirming(true)}>
          Koçluğu sonlandır
        </Button>
      )}

      {refund ? (
        <div className="space-y-1">
          <p className="text-body text-ink">{refund.status}</p>
          {refund.amount ? (
            <p className="text-small tabular-nums text-ink-mid">{`Tutar: ${refund.amount}.`}</p>
          ) : null}
          <p className="text-small text-ink-mid">
            Sorun yaşarsan{" "}
            <Link href="/support" className="font-medium text-ink underline underline-offset-4">
              Hocam destek
            </Link>
            .
          </p>
        </div>
      ) : null}

      <CoachingConfirmDialog
        open={confirming}
        title="Koçluğu sonlandırmak istiyor musun?"
        description="Henüz başlamamış koçluk dönemlerin iptal edilir; devam eden dönem sonuna kadar sürer. Ders paketin etkilenmez. Bu talep geri alınamaz."
        confirmLabel="Sonlandırmayı iste"
        isPending={cancel.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => cancel.mutate(undefined, { onSettled: () => setConfirming(false) })}
      />
      {cancel.error ? (
        <InlineError message="İptal talebi güncel durumla çakıştı. Sayfayı yenileyip tekrar dene." />
      ) : null}
    </section>
  );
}

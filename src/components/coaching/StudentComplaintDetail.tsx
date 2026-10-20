"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingConfirmDialog } from "@/components/coaching/CoachingConfirmDialog";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingFilePicker } from "@/components/coaching/CoachingFilePicker";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { ComplaintStatusChip } from "@/components/coaching/StudentComplaintCards";
import { InlineError } from "@/components/shared/InlineError";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  COACHING_FAZ8_QUERY_KEYS,
  applyStudentCoachingDisputeRemedy,
  coachingEvidenceScanStateLabel,
  extractCoachingErrorMessage,
  fetchCoachingDisputeEvidenceAccessUrl,
  fetchStudentCoachingDispute,
  requestCoachingDisputeEvidenceDeletion,
  uploadCoachingDisputeEvidence,
} from "@/lib/coachingApi";
import { buildDisputeDetail } from "@/lib/coachingStudentComplaints";

const EVIDENCE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx";
const LIST_HREF = "/dashboard/student/coaching/complaints";
const TEXT_BUTTON = "min-h-11 text-small font-medium text-ink underline underline-offset-4 disabled:text-ink-mid";
const CARD = "space-y-3 rounded-card border border-line bg-surface p-5";

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } } | null)?.response?.status === 404;
}

/**
 * One complaint of the student's: what was filed, how it stands, what the tutor
 * answered, the dated process, the evidence, and, once the review has decided,
 * the choice between the remedies the server allows. A choice is final, so it
 * is asked for again before it is applied, and what was chosen stays written.
 */
export function StudentComplaintDetail({ disputeId }: { disputeId: string }) {
  const client = useQueryClient();
  const [picked, setPicked] = useState<{ value: string; label: string } | null>(null);

  const query = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.studentDispute(disputeId),
    queryFn: () => fetchStudentCoachingDispute(disputeId),
  });
  const refresh = () => {
    client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDispute(disputeId) });
    client.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes() });
  };
  const upload = useMutation({
    mutationFn: (file: File) => uploadCoachingDisputeEvidence(disputeId, file),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: requestCoachingDisputeEvidenceDeletion,
    onSuccess: refresh,
  });
  const access = useMutation({
    mutationFn: fetchCoachingDisputeEvidenceAccessUrl,
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
  });
  const remedy = useMutation({
    mutationFn: (params: { remedyType: string; determinationId: string }) =>
      applyStudentCoachingDisputeRemedy(disputeId, {
        remedy_type: params.remedyType,
        determination_id: params.determinationId,
      }),
    onSuccess: refresh,
    onError: refresh,
    onSettled: () => setPicked(null),
  });

  const detail = useMemo(() => (query.data ? buildDisputeDetail(query.data) : null), [query.data]);

  if (query.isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (query.isError && !isNotFound(query.error)) {
    return (
      <CoachingLoadError
        message="Sorun bildirimin yüklenemedi."
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }
  if (!query.data || !detail) {
    return (
      <CoachingEmptyState
        title="Sorun bildirimi bulunamadı"
        description="Bu kayıt artık erişilebilir değil veya hesabına ait değil."
      />
    );
  }

  const dispute = query.data;

  return (
    <div className="space-y-4">
      <Link
        href={LIST_HREF}
        className="inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4"
      >
        Tüm bildirimlerim
      </Link>

      <section aria-label="Sorun özeti" className="rounded-card bg-ink p-5 text-paper sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <p className="text-small tabular-nums">{`Sorun bildirimi · ${detail.whenLabel}`}</p>
            <h2 className="text-h3-m font-bold md:text-h3 md:font-bold">{detail.title}</h2>
          </div>
          <ComplaintStatusChip label={detail.statusLabel} tone={detail.tone} onInk />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-body">{detail.description}</p>
      </section>

      {detail.needsMoreInfo ? (
        <section aria-label="Ek bilgi gerekli" className={CARD}>
          <h2 className="text-body font-medium text-ink">Ek bilgi gerekli</h2>
          <p className="text-body text-ink-mid">
            Süreç mesajını inceleyip istenen bağlamı veya kanıtı aşağıdan ekleyebilirsin. Bu durum tek başına bir
            iade ya da çözüm kararı değildir.
          </p>
        </section>
      ) : null}

      {detail.responses.length > 0 ? (
        <section aria-label="Hocanın yanıtı" className={CARD}>
          <h2 className="text-body font-medium text-ink">Hocanın yanıtı</h2>
          <div className="space-y-3">
            {detail.responses.map((reply, index) => (
              <div key={`${reply.when}-${index}`}>
                <p className="text-small tabular-nums text-ink-mid">{reply.when}</p>
                <p className="whitespace-pre-wrap text-body text-ink">{reply.body}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {detail.steps.length > 0 ? (
        <section aria-label="Süreç" className={CARD}>
          <h2 className="text-body font-medium text-ink">Süreç</h2>
          <ol className="space-y-2">
            {detail.steps.map((step, index) => (
              <li key={`${step.when}-${index}`} className="flex flex-col gap-x-4 sm:flex-row">
                <span className="shrink-0 text-small tabular-nums text-ink-mid sm:w-44">{step.when}</span>
                <span className="text-body text-ink">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {detail.choice ? (
        <section aria-label="Seçimin gerekli" className="space-y-3 rounded-card border-2 border-ink bg-surface p-5">
          <h2 className="text-body font-medium text-ink">Seçimin gerekli</h2>
          <p className="text-body text-ink-mid">
            {`İnceleme sonucu: ${detail.choice.meritLabel}. Birini seçtiğinde sonra değiştiremezsin.`}
          </p>
          <ul className="space-y-2">
            {detail.choice.options.map((option) => (
              <li
                key={option.value}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-input border border-line p-3"
              >
                <span className="text-body text-ink">{option.label}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="gold"
                  className="min-h-11"
                  disabled={remedy.isPending}
                  aria-label={`${option.label}: Bunu seç`}
                  onClick={() => setPicked(option)}
                >
                  Bunu seç
                </Button>
              </li>
            ))}
          </ul>
          <InlineError
            size="sm"
            message={remedy.error ? "Sonuç değişmiş olabilir; güncel karar yeniden yüklendi." : null}
          />
          <CoachingConfirmDialog
            open={picked !== null}
            tone="default"
            title="Bu çözümü seçiyorsun"
            description={`${picked?.label ?? ""}. Bunu seçince sonra değiştiremezsin.`}
            confirmLabel="Seçimi onayla"
            isPending={remedy.isPending}
            onCancel={() => setPicked(null)}
            onConfirm={() =>
              picked &&
              detail.choice &&
              remedy.mutate({ remedyType: picked.value, determinationId: detail.choice.determinationId })
            }
          />
        </section>
      ) : null}

      {detail.chosen ? (
        <section aria-label="Seçtiğin çözüm" className={CARD}>
          <h2 className="text-body font-medium text-ink">Seçtiğin çözüm</h2>
          <p className="text-body text-ink">{detail.chosen.label}</p>
          {detail.chosen.refund ? (
            <div className="space-y-1">
              <p className="text-body text-ink">{detail.chosen.refund.status}</p>
              {detail.chosen.refund.amount ? (
                <p className="text-small tabular-nums text-ink-mid">{`Tutar: ${detail.chosen.refund.amount}.`}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Kanıtlar" className={CARD}>
        <h2 className="text-body font-medium text-ink">Kanıtlar</h2>
        <CoachingFilePicker
          tone="gold"
          label="Kanıt dosyası ekle"
          hint="PDF, JPG, PNG, WebP, DOCX veya PPTX; en fazla 10 MB."
          accept={EVIDENCE_ACCEPT}
          busy={upload.isPending}
          onFile={(file) => upload.mutate(file)}
        />
        <InlineError size="sm" message={upload.error ? extractCoachingErrorMessage(upload.error) : null} />
        {dispute.evidence.length > 0 ? (
          <ul className="space-y-2">
            {dispute.evidence.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-input border border-line p-3 text-small sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 break-words text-ink">
                  {item.original_name} · {coachingEvidenceScanStateLabel(item.scan_state)}
                  {item.deleted_requested ? " · silme talebi alındı" : ""}
                </span>
                <div className="flex gap-4">
                  {item.scan_state === "active" && !item.deleted_requested ? (
                    <button
                      type="button"
                      className={TEXT_BUTTON}
                      disabled={access.isPending}
                      onClick={() => access.mutate(item.id)}
                    >
                      Görüntüle
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={TEXT_BUTTON}
                    disabled={item.deleted_requested || remove.isPending}
                    onClick={() => remove.mutate(item.id)}
                  >
                    Silinmesini iste
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <InlineError size="sm" message={access.error ? "Dosya görüntülenemedi." : null} />
        <InlineError size="sm" message={remove.error ? "Silme talebi gönderilemedi." : null} />
        <p className="text-small text-ink-mid">
          Taraması tamamlanmamış, kullanılamayan veya reddedilen kanıtlar karara esas alınmaz.
        </p>
      </section>
    </div>
  );
}

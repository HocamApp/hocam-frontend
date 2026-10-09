"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { InlineError } from "@/components/shared/InlineError";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingEmptyState } from "@/components/coaching/CoachingEmptyState";
import { CoachingFilePicker } from "@/components/coaching/CoachingFilePicker";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { CoachingSectionHeading } from "@/components/coaching/CoachingSectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  COACHING_FAZ8_QUERY_KEYS,
  applyStudentCoachingDisputeRemedy,
  coachingDisputeCategoryLabel,
  coachingDisputeMeritLabel,
  coachingDisputeRemedyLabel,
  coachingDisputeStatusLabel,
  coachingEvidenceScanStateLabel,
  extractCoachingErrorMessage,
  fetchCoachingDisputeEvidenceAccessUrl,
  fetchStudentCoachingDispute,
  requestCoachingDisputeEvidenceDeletion,
  uploadCoachingDisputeEvidence,
} from "@/lib/coachingApi";

const EVIDENCE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx";

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } } | null)?.response?.status === 404;
}

function Detail() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const client = useQueryClient();
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
    mutationFn: (remedyType: string) =>
      applyStudentCoachingDisputeRemedy(disputeId, {
        remedy_type: remedyType,
        determination_id: query.data!.determination!.id,
      }),
    onSuccess: refresh,
    onError: refresh,
  });

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
  if (!query.data) {
    return (
      <CoachingEmptyState
        title="Sorun bildirimi bulunamadı"
        description="Bu kayıt artık erişilebilir değil veya hesabına ait değil."
      />
    );
  }

  const dispute = query.data;
  const remedies = dispute.determination?.allowed_remedies ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-3 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CoachingSectionHeading>Sorun özeti</CoachingSectionHeading>
              <p className="text-small text-ink-mid">
                {coachingDisputeCategoryLabel(dispute.category)}
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-line bg-transparent text-ink">
              {coachingDisputeStatusLabel(dispute.status)}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-body text-ink">{dispute.description}</p>
        </CardContent>
      </Card>

      {dispute.status === "needs_more_info" ? (
        <Card>
          <CardContent className="space-y-1 py-4">
            <CoachingSectionHeading level="subsection">Ek bilgi gerekli</CoachingSectionHeading>
            <p className="text-body text-ink-mid">
              Süreç mesajını inceleyip istenen bağlamı veya kanıtı aşağıdan ekleyebilirsin. Bu
              durum tek başına bir iade ya da çözüm kararı değildir.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 py-5">
          <CoachingSectionHeading level="subsection">Kanıtlar</CoachingSectionHeading>
          <CoachingFilePicker
            label="Kanıt dosyası ekle"
            hint="PDF, JPG, PNG, WebP, DOCX veya PPTX; en fazla 10 MB."
            accept={EVIDENCE_ACCEPT}
            busy={upload.isPending}
            onFile={(file) => upload.mutate(file)}
          />
          <InlineError
            size="sm"
            message={upload.error ? extractCoachingErrorMessage(upload.error) : null}
          />
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
                <div className="flex gap-1">
                  {item.scan_state === "active" && !item.deleted_requested ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={access.isPending}
                      onClick={() => access.mutate(item.id)}
                    >
                      Görüntüle
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={item.deleted_requested || remove.isPending}
                    onClick={() => remove.mutate(item.id)}
                  >
                    Silinmesini iste
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-small text-ink-mid">
            Taraması tamamlanmamış, kullanılamayan veya reddedilen kanıtlar karara esas alınmaz.
          </p>
        </CardContent>
      </Card>

      {dispute.timeline.length ? (
        <Card>
          <CardContent className="space-y-2 py-5">
            <CoachingSectionHeading level="subsection">Süreç</CoachingSectionHeading>
            <ol className="space-y-1">
              {dispute.timeline.map((item, index) => (
                <li className="text-body text-ink" key={`${item.created_at}-${index}`}>
                  {item.participant_message || "Süreç güncellemesi"}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {remedies.length && !dispute.application ? (
        <Card>
          <CardContent className="space-y-3 py-5">
            <CoachingSectionHeading level="subsection">Seçimin gerekli</CoachingSectionHeading>
            <p className="text-body text-ink-mid">
              İnceleme sonucu: {coachingDisputeMeritLabel(dispute.determination!.merit)}. Sunulan
              seçeneklerden birini seçebilirsin.
            </p>
            <div className="flex flex-wrap gap-2">
              {remedies.map((item) => (
                <Button key={item} disabled={remedy.isPending} onClick={() => remedy.mutate(item)}>
                  {coachingDisputeRemedyLabel(item)}
                </Button>
              ))}
            </div>
            <InlineError
              size="sm"
              message={remedy.error ? "Sonuç değişmiş olabilir; güncel karar yeniden yüklendi." : null}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function StudentCoachingComplaintDetailPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Koçluk sorun bildirimi"
        width="narrow"
        currentHref="/dashboard/student/coaching/complaints"
        audience="student"
      >
        <Detail />
      </CoachingPageShell>
    </RouteGuard>
  );
}

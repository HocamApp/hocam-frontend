"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { InlineError } from "@/components/shared/InlineError";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  COACHING_FAZ8_QUERY_KEYS,
  coachingDisputeCategoryLabel,
  createStudentCoachingDispute,
  fetchCoachingDisputeEligibility,
} from "@/lib/coachingApi";
import { categoryDeadlineLines } from "@/lib/coachingStudentComplaints";

/**
 * The form for a new complaint. The server decides which topics are open right
 * now and until when; nothing is chosen for the student, because a form that
 * opened with the first reason already picked put an accusation nobody had made
 * in front of someone who only opened the page. A link can name the topic it is
 * about (`initialTopic`), and it is taken only if the server lists it.
 */
export function NewComplaintForm({
  purchaseId,
  initialTopic,
  onClose,
}: {
  purchaseId: string;
  initialTopic?: string | null;
  /** Given when the form was opened from the list, so it can be put away again. */
  onClose?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const topicId = useId();
  const descriptionId = useId();
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const eligibility = useQuery({
    queryKey: COACHING_FAZ8_QUERY_KEYS.eligibility(purchaseId),
    queryFn: () => fetchCoachingDisputeEligibility(purchaseId),
  });
  const create = useMutation({
    mutationFn: (data: { category: string; description: string }) =>
      createStudentCoachingDispute(purchaseId, { ...data, submission_key: crypto.randomUUID() }),
    onSuccess: (dispute) => {
      queryClient.invalidateQueries({ queryKey: COACHING_FAZ8_QUERY_KEYS.studentDisputes() });
      router.push(`/dashboard/student/coaching/complaints/${dispute.id}`);
    },
  });

  const topics = eligibility.data?.categories ?? [];
  // The local choice can lag a refetch, so what is sent is always taken from the live list.
  const wanted = category ?? initialTopic ?? "";
  const selected = topics.includes(wanted) ? wanted : "";
  const deadlines = useMemo(() => categoryDeadlineLines(eligibility.data ?? {}), [eligibility.data]);
  const canSubmit = Boolean(selected) && Boolean(description.trim()) && !create.isPending;

  return (
    <section aria-label="Yeni sorun bildirimi" className="space-y-4 rounded-card border border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-body font-medium text-ink">Yeni sorun bildirimi</h2>
        <p className="text-small text-ink-mid">Bildirimin mevcut koçluğuna bağlanır ve destek ekibi inceler.</p>
      </div>

      {eligibility.isLoading ? (
        <div aria-label="Sorun konuları yükleniyor" className="space-y-3">
          <div className="h-11 animate-pulse rounded-input bg-skeleton" />
          <div className="h-32 animate-pulse rounded-input bg-skeleton" />
        </div>
      ) : eligibility.isError ? (
        <CoachingLoadError
          message="Sorun konuları yüklenemedi."
          onRetry={() => eligibility.refetch()}
          isRetrying={eligibility.isFetching}
        />
      ) : topics.length === 0 ? (
        // An empty list is an answer, not a failure: nothing is open to report right now.
        <p className="text-small leading-[1.5] text-ink-mid">
          Şu anda bildirebileceğin bir sorun konusu görünmüyor. Koçluk kaydın ilerledikçe uygun konular burada
          listelenir.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor={topicId} className="block text-small font-medium text-ink">
              Sorun konusu
            </label>
            <select
              id={topicId}
              className="h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink transition-colors duration-[--duration-state] focus:border-ink focus:outline-none"
              value={selected}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Konu seç</option>
              {topics.map((item) => (
                <option key={item} value={item}>
                  {coachingDisputeCategoryLabel(item)}
                </option>
              ))}
            </select>
            {selected && deadlines[selected] ? (
              <p className="text-small tabular-nums text-ink-mid">{deadlines[selected]}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor={descriptionId} className="block text-small font-medium text-ink">
              Durumun açıklaması
            </label>
            <Textarea
              id={descriptionId}
              className="min-h-32 bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Durumu kısaca açıkla"
            />
          </div>
        </>
      )}

      {create.error ? (
        <InlineError message="Sorun bildirimi oluşturulamadı. Güncel durumu tekrar kontrol et." />
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={!canSubmit} onClick={() => create.mutate({ category: selected, description })}>
          {create.isPending ? "Gönderiliyor…" : "Sorunu gönder"}
        </Button>
        {onClose ? (
          <button
            type="button"
            className="min-h-11 text-small font-medium text-ink underline underline-offset-4"
            onClick={onClose}
          >
            Vazgeç
          </button>
        ) : null}
      </div>
    </section>
  );
}
